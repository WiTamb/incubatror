import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApplicationService } from '../../../core/services/application.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuestionnaireService } from '../../../core/services/questionnaire.service';
import { Role } from '../../../core/models/user.model';
import { Application, Session, Round, QuestionnaireAnswer } from '../../../core/models/session.model';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { RoundStepperComponent } from '../../shared/round-stepper/round-stepper.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-applicants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent, RoundStepperComponent, ConfirmModalComponent],
  template: `
    <!-- Header -->
    <div class="flex items-center gap-2 mb-2">
      <a [routerLink]="[basePath + '/sessions', sessionId]" class="text-text-muted hover:text-text-primary">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </a>
      <h1 class="page-title">Candidats — {{ session?.name }}</h1>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3 mb-6 flex-wrap">
      <div class="relative flex-1 max-w-xs">
        <input class="input pl-10" placeholder="Rechercher par nom ou email..." [(ngModel)]="search">
        <svg class="w-5 h-5 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </div>
      <select class="input max-w-[180px]" [(ngModel)]="filterStatus">
        <option value="">Tous les statuts</option>
        <option value="PENDING">En attente de revue</option>
        <option value="ACCEPTED">Acceptés (En cours)</option>
        <option value="ELIMINATED">Éliminés</option>
        <option value="REJECTED">Rejetés au début</option>
        <option value="COMPLETED">Diplômés / Terminés</option>
      </select>
      <select class="input max-w-[180px]" [(ngModel)]="filterRound">
        <option value="">Tous les rounds</option>
        @for (r of rounds; track r.id) { <option [value]="r.id">{{ r.name }}</option> }
      </select>
      <div class="flex-1"></div>
      <button (click)="exportCSV()" class="btn-ghost btn-sm text-xs border border-slate-200 flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        Export CSV
      </button>
    </div>

    <!-- Table -->
    <div class="table-container shadow-xl">
      <table class="w-full">
        <thead><tr class="table-header">
          <th class="px-6 py-4 text-left">Candidat</th>
          <th class="px-6 py-4 text-left">Progression</th>
          <th class="px-6 py-4 text-center">Score Moyen</th>
          <th class="px-6 py-4 text-center">Statut Actuel</th>
          <th class="px-6 py-4 text-right">Actions de Workflow</th>
        </tr></thead>
        <tbody>
          @for (a of filtered; track a.id) {
            <tr class="table-row cursor-pointer" [class.opacity-50]="isOut(a)" (click)="selectApp(a)">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0 border border-primary-200">
                    {{ initials(a.candidateName) }}
                  </div>
                  <div>
                    <p class="font-bold text-sm text-text-primary">{{ a.candidateName }}</p>
                    <p class="text-xs text-text-muted">{{ a.candidateEmail }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                  <span class="text-xs font-medium text-text-secondary">{{ a.currentRoundName || 'Initial' }}</span>
                  <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-500 transition-all" [style.width.%]="(a.currentRoundIndex || 0) * 33.3"></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                @if (a.averageScore != null) {
                  <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold"
                        [class]="a.averageScore >= 70 ? 'bg-success-50 text-success-700' : a.averageScore >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-danger-50 text-danger-700'">
                    {{ a.averageScore | number:'1.1-1' }}
                  </span>
                } @else {
                  <span class="text-xs text-text-muted italic">—</span>
                }
              </td>
              <td class="px-6 py-4 text-center"><app-status-badge [status]="a.status" /></td>
              <td class="px-6 py-4" (click)="$event.stopPropagation()">
                <div class="flex items-center justify-end gap-2">
                  <button (click)="selectApp(a); $event.stopPropagation()" class="btn-ghost btn-sm px-2 py-1 text-primary-600 hover:bg-primary-50 rounded-lg" title="Voir l'historique des évaluations">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </button>
                  @if (!isInAdminSpace) {
                    @if (getMyEvaluation(a)) {
                      <button (click)="openEval(a); $event.stopPropagation()" 
                              [disabled]="isOut(a) || !isRoundActive(a.currentRoundId)" 
                              class="btn-primary btn-xs text-[10px] px-3 py-1 bg-blue-500 hover:bg-blue-600 border-none disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
                              [title]="!isRoundActive(a.currentRoundId) ? 'Evaluation non autorisée (Round non actif)' : 'Modifier votre évaluation'">
                        Modifier
                      </button>
                    } @else {
                      <button (click)="openEval(a); $event.stopPropagation()" 
                              [disabled]="isOut(a) || !isRoundActive(a.currentRoundId)" 
                              class="btn-primary btn-xs text-[10px] px-3 py-1 bg-amber-500 hover:bg-amber-600 border-none disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
                              [title]="!isRoundActive(a.currentRoundId) ? 'Evaluation non autorisée (Round non actif)' : 'Évaluer ce candidat'">
                        Évaluer
                      </button>
                    }
                  }
                  @if (isAdmin) {
                    @if (a.status === 'PENDING') {
                      <button (click)="confirmAction('reject', a)" class="btn-ghost btn-sm text-[10px] text-danger-500 hover:bg-danger-50 px-3 py-1">Rejeter</button>
                    }
                    @if (a.status.startsWith('ACCEPTED')) {
                      <button (click)="confirmAction('advance', a)" class="btn-accent btn-sm text-[10px] px-3 py-1">Avancer →</button>
                      <button (click)="confirmAction('eliminate', a)" class="btn-ghost btn-sm text-[10px] text-danger-500 hover:bg-danger-50 px-3 py-1">Éliminer</button>
                    }
                  }
                </div>
              </td>
            </tr>
          }
          @if (filtered.length === 0) {
            <tr><td colspan="4" class="p-12 text-center text-text-muted italic">Aucun candidat ne correspond à vos critères.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Evaluation Modal -->
    @if (evalTarget) {
      <div class="overlay" (click)="evalTarget = null"></div>
      <div class="slide-over p-8 w-full max-w-md">
        <h2 class="text-xl font-bold mb-6">Évaluer {{ evalTarget.candidateName }}</h2>
        <form (ngSubmit)="doEval()" class="space-y-4">
          <div class="form-group">
            <label class="label">Note (0 - 100)</label>
            <input type="number" class="input" [(ngModel)]="evalForm.score" name="score" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label class="label">Commentaire</label>
            <textarea class="input min-h-[120px]" [(ngModel)]="evalForm.comment" name="comment" required placeholder="Votre avis sur le projet..."></textarea>
          </div>
          <div class="form-group">
            <label class="label">Recommandation (Optionnel)</label>
            <input class="input" [(ngModel)]="evalForm.recommendation" name="recom" placeholder="Ex: Très prometteur">
          </div>
          <button type="submit" class="btn-primary btn-md w-full shadow-lg bg-amber-500 hover:bg-amber-600 border-none" [disabled]="submitting">
            {{ submitting ? 'Envoi...' : 'Enregistrer la note' }}
          </button>
        </form>
      </div>
    }

    <!-- Slide-over detail with Evaluation History -->
    @if (selected) {
      <div class="overlay" (click)="selected = null"></div>
      <div class="slide-over p-8 w-full max-w-xl">
        <div class="flex items-start justify-between mb-8">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold border-2 border-primary-200">
              {{ initials(selected.candidateName) }}
            </div>
            <div>
              <h2 class="text-xl font-black text-text-primary">{{ selected.candidateName }}</h2>
              <p class="text-sm text-text-muted">{{ selected.candidateEmail }}</p>
              <div class="flex gap-2 mt-2">
                <app-status-badge [status]="selected.status" />
                <span class="badge-slate">{{ selected.currentRoundName || 'Round 1' }}</span>
              </div>
            </div>
          </div>
          <button (click)="selected = null" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-text-muted transition-colors">✕</button>
        </div>

        <!-- Round stepper -->
        @if (rounds.length) {
          <div class="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 class="text-[10px] font-bold text-text-muted mb-6 uppercase tracking-widest">Parcours d'Incubation</h3>
            <app-round-stepper [rounds]="rounds" [currentRoundIndex]="selected.currentRoundIndex" [status]="selected.status" />
          </div>
        }

        <!-- Evaluation History (CRITICAL FEATURE) -->
        <div class="space-y-6">
          <h3 class="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">Historique des Évaluations</h3>
          
          @for (ev of selected.evaluationHistory; track ev.id) {
            <div class="card p-5 border-l-4 border-l-primary-500 bg-white shadow-sm">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase">{{ ev.roundName }}</span>
                  <h4 class="text-sm font-bold mt-1">Évaluation par {{ ev.evaluatorName }}</h4>
                </div>
                <div class="text-right">
                  <span class="text-lg font-black text-primary-600">{{ ev.score }}/100</span>
                  <p class="text-[10px] text-text-muted">{{ ev.evaluatedAt | date:'dd MMM yyyy' }}</p>
                </div>
              </div>
              <p class="text-sm text-text-secondary italic mb-3">"{{ ev.comment }}"</p>
              @if (ev.recommendation) {
                <div class="flex items-start gap-2 bg-slate-50 p-3 rounded-lg">
                  <svg class="w-4 h-4 text-primary-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <p class="text-xs text-text-primary font-medium"><span class="text-text-muted">Recommandation:</span> {{ ev.recommendation }}</p>
                </div>
              }
            </div>
          }

          @if (!selected.evaluationHistory?.length) {
            <div class="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <p class="text-sm text-text-muted">Aucune évaluation enregistrée pour le moment.</p>
            </div>
          }
        </div>

        <!-- Questionnaire Answers -->
        <div class="mt-10 pt-10 border-t border-slate-100">
          <h3 class="text-[10px] font-bold text-text-muted mb-6 uppercase tracking-widest">Réponses au Questionnaire</h3>
          
          @if (answersLoading) {
            <div class="space-y-4">
              @for (i of [1,2]; track i) {
                <div class="h-20 bg-slate-50 rounded-xl animate-pulse"></div>
              }
            </div>
          } @else if (selectedAnswers.length > 0) {
            <div class="space-y-6">
              @for (a of selectedAnswers; track a.id) {
                <div class="group">
                  @if (a._roundName) {
                    <span class="text-[9px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase mb-1 inline-block">{{ a._roundName }}</span>
                  }
                  <p class="text-xs font-bold text-text-primary mb-2 flex items-start gap-2">
                    <span class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-text-muted flex-shrink-0">{{ $index + 1 }}</span>
                    {{ a.question?.label || 'Question' }}
                  </p>
                    <div class="pl-7">
                      <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-text-secondary leading-relaxed">
                        <ng-container *ngIf="a.answer?.toLowerCase().includes('.pdf') || a.answer?.toLowerCase().includes('.jpg') || a.answer?.toLowerCase().includes('.png') || a.question?.type === 'FILE'">
                          <a [href]="getFileUrl(a.answer?.trim() || '')" target="_blank" class="flex items-center gap-2 font-bold" style="color: #2563eb; text-decoration: underline;">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {{ a.answer }} (Ouvrir)
                          </a>
                        </ng-container>
                        <ng-container *ngIf="!a.answer?.toLowerCase().includes('.pdf') && !a.answer?.toLowerCase().includes('.jpg') && !a.answer?.toLowerCase().includes('.png') && a.question?.type !== 'FILE'">
                          <ng-container *ngIf="a.answer?.toLowerCase().includes('http') || a.question?.type === 'VIDEO_URL'">
                             <a [href]="a.answer?.trim() || ''" target="_blank" class="flex items-center gap-2 font-bold" style="color: #2563eb; text-decoration: underline;">
                               <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               {{ a.answer }} (Ouvrir le lien)
                             </a>
                          </ng-container>
                          <ng-container *ngIf="!a.answer?.toLowerCase().includes('http') && a.question?.type !== 'VIDEO_URL'">
                            {{ a.answer }}
                          </ng-container>
                        </ng-container>
                      </div>
                    </div>
                </div>
              }
            </div>
          } @else {
            <div class="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <p class="text-xs text-text-muted italic">Aucun questionnaire rempli pour cette candidature.</p>
            </div>
          }
        </div>
      </div>
    }

    <app-confirm-modal
      [open]="!!pendingAction"
      [title]="actionTitle"
      [message]="actionMessage"
      [confirmText]="actionConfirmText"
      [type]="actionType"
      (confirm)="doAction()"
      (cancel)="pendingAction = null"
    />
  `
})
export class ApplicantsComponent implements OnInit {
  sessionId = 0;
  session: Session | null = null;
  rounds: Round[] = [];
  applicants: Application[] = [];
  selected: Application | null = null;
  search = ''; filterStatus = ''; filterRound = '';
  submitting = false;
  evalTarget: Application | null = null;
  evalForm = { score: 0, comment: '', recommendation: '' };
  selectedAnswers: any[] = [];
  answersLoading = false;

  pendingAction: { action: string; app: Application } | null = null;
  basePath = '/evaluator';
  isAdmin = false;
  isInAdminSpace = false;

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private appSvc: ApplicationService, 
    private sessionSvc: SessionService,
    private questionnaireSvc: QuestionnaireService,
    private auth: AuthService
  ) {}

  getFileUrl(filename: string): string {
    if (!filename) return '#';
    // If it's already a full URL, return it
    if (filename.startsWith('http')) return filename;
    // Otherwise, point to the backend uploads endpoint
    return `${environment.apiUrl}/api/files/download/${filename}`;
  }

  ngOnInit() {
    this.isAdmin = this.auth.userRole() === Role.ADMIN;
    this.basePath = this.router.url.startsWith('/admin') ? '/admin' : '/evaluator';
    this.isInAdminSpace = this.router.url.startsWith('/admin');
    this.sessionId = +this.route.snapshot.paramMap.get('id')!;
    const rid = this.route.snapshot.paramMap.get('roundId');
    if (rid) this.filterRound = rid;

    this.sessionSvc.getSessionById(this.sessionId).subscribe(r => {
      this.session = r.data || null;
      this.rounds = (r.data?.rounds || []).sort((a, b) => a.orderIndex - b.orderIndex);
    });
    this.loadApplicants();
  }

  loadApplicants() {
    const rid = this.route.snapshot.paramMap.get('roundId');
    this.appSvc.getSessionApplications(this.sessionId, rid ? +rid : undefined).subscribe(r => this.applicants = r.data || []);
  }

  get filtered(): Application[] {
    return this.applicants.filter(a => {
      // 1. Search filter
      if (this.search && !a.candidateName.toLowerCase().includes(this.search.toLowerCase()) && !a.candidateEmail.toLowerCase().includes(this.search.toLowerCase())) return false;
      
      // 2. Status filter
      if (this.filterStatus === 'ACCEPTED' && !a.status.startsWith('ACCEPTED')) return false;
      if (this.filterStatus === 'ELIMINATED' && !a.status.startsWith('ELIMINATED')) return false;
      if (this.filterStatus && this.filterStatus !== 'ACCEPTED' && this.filterStatus !== 'ELIMINATED' && a.status !== this.filterStatus) return false;
      
      // 3. Round filter (Improved logic)
      if (this.filterRound) {
        const rid = +this.filterRound;
        // If filtering by Round 1, include those with currentRoundId == null AND status PENDING or ACCEPTED_ROUND_1
        if (rid === this.rounds[0]?.id) {
           const isRound1 = a.currentRoundId === rid || (a.currentRoundId == null && (a.status === 'PENDING' || a.status === 'ACCEPTED_ROUND_1'));
           if (!isRound1) return false;
        } else if (a.currentRoundId !== rid) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
  }

  isOut(a: Application) { return a.status === 'REJECTED' || a.status.startsWith('ELIMINATED'); }
  
  isRoundActive(roundId: number | undefined): boolean {
    if (this.rounds.length === 0) return false;
    
    let round;
    if (!roundId) {
      round = this.rounds[0];
    } else {
      round = this.rounds.find(r => r.id === roundId);
    }
    
    const isActive = round?.status === 'ACTIVE';
    console.log(`Checking if round ${roundId || 'Initial'} is active:`, isActive, 'Status:', round?.status);
    return isActive;
  }

  initials(name: string) { return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); }
  selectApp(a: Application) { 
    this.selected = a; 
    this.selectedAnswers = [];
    this.answersLoading = true;

    // Determine which round to load answers from
    const roundId = a.currentRoundId || (this.rounds.length > 0 ? this.rounds[0].id : null);
    if (!roundId) {
      this.answersLoading = false;
      return;
    }

    // Load answers for ALL rounds so the evaluator sees complete questionnaire responses
    const roundsToLoad = this.rounds.filter(r => r.orderIndex <= (a.currentRoundIndex || 1));
    if (roundsToLoad.length === 0) roundsToLoad.push(this.rounds[0]);

    let completed = 0;
    const allAnswers: any[] = [];
    roundsToLoad.forEach(round => {
      this.questionnaireSvc.getAnswers(round.id, a.id).subscribe({
        next: (r: any) => {
          const answers = (r.data || []).map((ans: any) => ({ ...ans, _roundName: round.name }));
          allAnswers.push(...answers);
          completed++;
          if (completed === roundsToLoad.length) {
            this.selectedAnswers = allAnswers;
            this.answersLoading = false;
          }
        },
        error: () => {
          completed++;
          if (completed === roundsToLoad.length) {
            this.selectedAnswers = allAnswers;
            this.answersLoading = false;
          }
        }
      });
    });
  }

  confirmAction(action: string, app: Application) { this.pendingAction = { action, app }; }

  get actionTitle() {
    const m: Record<string, string> = { accept: 'Valider la candidature ?', reject: 'Rejeter la candidature ?', advance: 'Passer au Round suivant ?', eliminate: 'Éliminer le candidat ?' };
    return m[this.pendingAction?.action || ''] || '';
  }
  get actionMessage() {
    const n = this.pendingAction?.app.candidateName || '';
    const m: Record<string, string> = { accept: `${n} sera admis au Round 1 et pourra soumettre son dossier technique.`, reject: `${n} ne sera pas admis dans cette session.`, advance: `${n} sera promu à l'étape suivante. Les évaluateurs du prochain round pourront voir vos remarques.`, eliminate: `${n} sera arrêté à cette étape du processus.` };
    return m[this.pendingAction?.action || ''] || '';
  }
  get actionConfirmText() {
    const m: Record<string, string> = { accept: 'Confirmer l\'Admission', reject: 'Confirmer le Rejet', advance: 'Promouvoir au Round suivant', eliminate: 'Confirmer l\'Élimination' };
    return m[this.pendingAction?.action || ''] || '';
  }
  get actionType(): 'danger' | 'primary' {
    return this.pendingAction?.action === 'reject' || this.pendingAction?.action === 'eliminate' ? 'danger' : 'primary';
  }

  getMyEvaluation(a: Application) {
    const email = this.auth.currentUser()?.email;
    if (!email || !a.evaluationHistory) return null;
    
    // Find if the current evaluator has already scored this candidate FOR THE CURRENT ROUND
    return a.evaluationHistory.find(e => e.evaluatorEmail === email && e.roundId === a.currentRoundId);
  }

  openEval(a: Application) {
    this.evalTarget = a;
    const existing = this.getMyEvaluation(a);
    if (existing) {
      this.evalForm = { 
        score: existing.score, 
        comment: existing.comment, 
        recommendation: existing.recommendation || '' 
      };
    } else {
      this.evalForm = { score: 0, comment: '', recommendation: '' };
    }
  }

  doEval() {
    if (!this.evalTarget) return;
    this.submitting = true;
    this.appSvc.evaluateApplication(this.evalTarget.id, this.evalForm).subscribe({
      next: (res: any) => {
        alert('Évaluation enregistrée avec succès !');
        this.submitting = false;
        if (this.selected && this.selected.id === this.evalTarget?.id) {
          this.selected = res.data;
        }
        this.evalTarget = null;
        this.loadApplicants();
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors de l\'évaluation. Vérifiez que le candidat a bien soumis son projet pour ce round.');
        this.submitting = false;
      }
    });
  }

  doAction() {
    if (!this.pendingAction) return;
    const { action, app } = this.pendingAction;
    const obs = action === 'accept' ? this.appSvc.acceptApplication(app.id)
      : action === 'reject' ? this.appSvc.rejectApplication(app.id)
      : action === 'advance' ? this.appSvc.advanceApplication(app.id)
      : this.appSvc.eliminateApplication(app.id);
    obs.subscribe(() => { this.pendingAction = null; this.loadApplicants(); if (this.selected && this.selected.id === app.id) this.selected = null; });
  }

  exportCSV() {
    const rows = [['Nom', 'Email', 'Round', 'Statut', 'Date'].join(',')];
    this.filtered.forEach(a => rows.push([a.candidateName, a.candidateEmail, a.currentRoundName || '', a.status, a.appliedAt].join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `candidats_session_${this.sessionId}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
}
