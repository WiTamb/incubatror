import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApplicationService } from '../../../core/services/application.service';
import { SessionService } from '../../../core/services/session.service';
import { ProjectService } from '../../../core/services/project.service';
import { Application, Session, Round, EvaluationHistory } from '../../../core/models/session.model';
import { RoundStepperComponent } from '../../shared/round-stepper/round-stepper.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RoundStepperComponent, StatusBadgeComponent, FormsModule, RouterModule],
  template: `
    <h1 class="page-title mb-2">Mes candidatures</h1>
    <p class="page-subtitle mb-8">Suivez l'avancement de vos candidatures.</p>

    @if (loading) {
      <div class="space-y-4">
        @for (i of [1,2]; track i) {
          <div class="card p-6 animate-pulse"><div class="h-5 bg-slate-200 rounded w-1/3 mb-3"></div><div class="h-10 bg-slate-100 rounded w-full"></div></div>
        }
      </div>
    } @else if (apps.length === 0) {
      <div class="card p-12 text-center">
        <svg class="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="text-text-secondary mb-4">Vous n'avez pas encore postulé à une session.</p>
        <a routerLink="/candidate/sessions" class="btn-primary btn-sm">Explorer les sessions</a>
      </div>
    } @else {
      <div class="space-y-4">
        @for (app of apps; track app.id) {
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-semibold text-text-primary">{{ app.sessionName }}</h3>
                <p class="text-xs text-text-muted mt-0.5">Postulé le {{ app.appliedAt | date:'dd/MM/yyyy à HH:mm' }}</p>
              </div>
              <app-status-badge [status]="app.status" />
            </div>

            <!-- Round stepper -->
            @if (sessionRounds[app.sessionId]; as rounds) {
              <div class="py-4 px-2">
                <app-round-stepper [rounds]="rounds" [currentRoundIndex]="app.currentRoundIndex" [status]="app.status" />
              </div>
              
              <div class="mt-4 flex items-center justify-between gap-4">
                <div class="flex-1 p-3 rounded-xl text-sm font-medium text-center" [class]="msgClass(app)">
                  {{ statusMessage(app) }}
                </div>
                <div class="flex items-center gap-2">
                  <button *ngIf="app.status === 'COMPLETED'" [routerLink]="['/candidate/mentorship', app.id]" class="btn-primary btn-sm flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Espace Mentoring
                  </button>
                  <button (click)="openDetails(app)" class="btn-ghost btn-sm whitespace-nowrap">Détails & Évals →</button>
                </div>
              </div>

            }
          </div>
        }
      </div>
    }

    <!-- Slide-over details -->
    @if (selected) {
      <div class="overlay" (click)="selected = null"></div>
      <div class="slide-over p-8 w-full max-w-xl overflow-y-auto">
        <div class="flex items-start justify-between mb-8">
          <div>
            <h2 class="text-xl font-black text-text-primary">{{ selected.sessionName }}</h2>
            <p class="text-sm text-text-muted">Suivi de votre candidature</p>
          </div>
          <button (click)="selected = null" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-text-muted">✕</button>
        </div>

        <!-- Submission logic removed from slide-over -->


        <!-- Evaluation History (only for finalized rounds) -->
        <div class="space-y-6">
          <h3 class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Historique des Évaluations</h3>
          @if (getFinalizedEvals(selected).length > 0) {
            @for (ev of getFinalizedEvals(selected); track ev.id) {
              <div class="card p-5 border-l-4 border-l-primary-500">
                <div class="flex justify-between mb-2">
                  <span class="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase">{{ ev.roundName }}</span>
                  <span class="text-lg font-black text-primary-600">{{ ev.score }}/100</span>
                </div>
                <p class="text-sm text-text-secondary italic mb-2">"{{ ev.comment }}"</p>
                @if (ev.recommendation) {
                  <p class="text-xs text-text-muted">Recommandation : <span class="font-medium text-text-primary">{{ ev.recommendation }}</span></p>
                }
              </div>
            }
          } @else {
            <div class="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
              <p class="text-sm text-text-muted">Les évaluations seront visibles après la validation de la liste par le jury.</p>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class MyApplicationsComponent implements OnInit {
  apps: Application[] = [];
  sessionRounds: Record<number, Round[]> = {};
  loading = true;
  selected: Application | null = null;
  submitting = false;
  subForm: Record<number, any> = {};
  selectedFiles: Record<number, { doc?: File, img?: File }> = {};

  constructor(
    private appService: ApplicationService, 
    private sessionService: SessionService,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.appService.getMyApplications().subscribe(r => {
      this.apps = r.data || [];
      this.loading = false;
      this.apps.forEach(a => { if (this.canSubmit(a)) this.initForm(a); });
      const uniqueSessionIds = [...new Set(this.apps.map(a => a.sessionId))];
      uniqueSessionIds.forEach(sid => {
        this.sessionService.getSessionById(sid).subscribe(sr => {
          if (sr.data?.rounds) {
            this.sessionRounds[sid] = sr.data.rounds.sort((a, b) => a.orderIndex - b.orderIndex);
          }
        });
      });
    });
  }

  openDetails(app: Application) {
    this.selected = app;
  }

  onFileChange(event: any, appId: number, type: 'doc' | 'img') {
    const file = event.target.files[0];
    if (!this.selectedFiles[appId]) this.selectedFiles[appId] = {};
    if (type === 'doc') this.selectedFiles[appId].doc = file;
    else this.selectedFiles[appId].img = file;
  }

  initForm(app: Application) {
    if (!this.subForm[app.id]) {
      this.subForm[app.id] = { 
        title: '', 
        description: '', 
        githubUrl: '', 
        domain: '',
        teamMembers: '',
        videoUrl: '',
        sessionId: app.sessionId, 
        roundId: app.currentRoundId!, 
        applicationId: app.id 
      };
    }
  }

  canSubmit(app: Application): boolean {
    // Can submit if status is PENDING (for round 1) or ACCEPTED_ROUND_X (for round X+1)
    // AND if no project already submitted for this round (we'd need a backend check or simple flag)
    // For now, let's allow if status is PENDING or starts with ACCEPTED
    return app.status === 'PENDING' || app.status.startsWith('ACCEPTED');
  }

  submitProject(app: Application) {
    const form = this.subForm[app.id];
    if (!form || !form.title || !form.description) {
      alert('Veuillez remplir au moins le titre et la description.');
      return;
    }
    
    this.submitting = true;
    const files = this.selectedFiles[app.id] || {};

    const request = {
      title: form.title,
      description: form.description,
      domain: form.domain,
      teamMembers: form.teamMembers,
      videoUrl: form.videoUrl,
      githubUrl: form.githubUrl
    };

    console.log('Soumission directe...', request);

    this.projectService.submitProject(request as any, files.doc, files.img).subscribe({
      next: () => {
        alert('Projet soumis avec succès !');
        this.submitting = false;
        this.load();
      },
      error: (err) => { 
        alert(err.error?.message || 'Erreur lors de la soumission.');
        this.submitting = false; 
      }
    });
  }

  statusMessage(app: Application): string {
    if (app.status === 'PENDING') return 'Votre candidature est en cours d\'examen';
    if (app.status === 'REJECTED') return 'Votre candidature a été rejetée';
    if (app.status === 'COMPLETED') return 'Félicitations ! Vous avez terminé le parcours';
    const acc = app.status.match(/ACCEPTED_ROUND_(\d+)/);
    if (acc) return `Vous êtes au ${app.currentRoundName || 'Round ' + acc[1]}`;
    const elim = app.status.match(/ELIMINATED_ROUND_(\d+)/);
    if (elim) return `Éliminé au Round ${elim[1]}`;
    return '';
  }

  msgClass(app: Application): string {
    if (app.status === 'PENDING') return 'bg-warning-50 text-warning-700';
    if (app.status === 'REJECTED' || app.status.startsWith('ELIMINATED')) return 'bg-danger-50 text-danger-700';
    if (app.status === 'COMPLETED') return 'bg-success-50 text-success-700';
    return 'bg-primary-50 text-primary-700';
  }

  /** Only return evaluations for rounds where the selection has been finalized */
  getFinalizedEvals(app: Application): EvaluationHistory[] {
    if (!app.evaluationHistory?.length) return [];
    const rounds = this.sessionRounds[app.sessionId] || [];
    const finalizedRoundIds = new Set(
      rounds.filter(r => r.selectionFinalized).map(r => r.id)
    );
    return app.evaluationHistory.filter(ev => finalizedRoundIds.has(ev.roundId));
  }
}
