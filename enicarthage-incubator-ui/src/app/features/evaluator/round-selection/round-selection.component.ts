import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApplicationService } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { RoundResult, SelectionOverrideRequest } from '../../../core/models/session.model';

@Component({
  selector: 'app-round-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    @if (result) {
      <!-- Header -->
      <div class="flex items-center gap-2 mb-2">
        <button (click)="goBack()" class="text-text-muted hover:text-text-primary">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 class="page-title">Résultats de sélection</h1>
      </div>
      <p class="page-subtitle mb-8">{{ result.roundName }}</p>

      <!-- Status Banner -->
      @if (result.selectionFinalized) {
        <div class="bg-success-50 border border-success-200 text-success-800 p-4 rounded-xl mb-6 flex items-center gap-3">
          <svg class="w-6 h-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p class="font-bold">Sélection Finalisée</p>
            <p class="text-sm opacity-90">Le président du jury a validé cette liste. Les candidats ont été notifiés.</p>
          </div>
        </div>
      } @else if (result.selectionValidated) {
        <div class="bg-primary-50 border border-primary-200 text-primary-800 p-4 rounded-xl mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p class="font-bold">Liste vérifiée par l'Administration</p>
              <p class="text-sm opacity-90">En attente de la validation finale du président du jury ({{ result.juryPresident?.firstName }} {{ result.juryPresident?.lastName }}).</p>
            </div>
          </div>
          @if (isJuryPresident || isAdmin) {
            <button (click)="finalizeSelection()" class="btn-primary" [disabled]="loading || !result.allEvaluated"
                    [title]="!result.allEvaluated ? 'Toutes les évaluations doivent être complètes avant validation' : 'Valider la sélection'">
              Valider la sélection finale
            </button>
          }
        </div>
      } @else {
        <div class="bg-warning-50 border border-warning-200 text-warning-800 p-4 rounded-xl mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <p class="font-bold">Liste Provisoire</p>
              <p class="text-sm opacity-90">L'administration peut encore modifier cette liste (avec justification) avant validation.</p>
            </div>
          </div>
          @if (isAdmin) {
            <button (click)="saveOverrides()" class="btn-primary" [disabled]="loading || !hasOverrides()">
              Enregistrer les modifications
            </button>
          } @else if (isJuryPresident) {
            <button (click)="finalizeSelection()" class="btn-primary" [disabled]="loading || !result.allEvaluated"
                    [title]="!result.allEvaluated ? 'Toutes les évaluations doivent être complètes avant validation' : 'Valider la sélection'">
              Valider la sélection finale
            </button>
          }
        </div>
      }

      <!-- Evaluation progress banner -->
      @if (!result.selectionFinalized) {
        <div class="mb-6 p-4 rounded-xl border flex items-center gap-3"
             [class]="result.allEvaluated ? 'bg-success-50 border-success-200 text-success-700' : 'bg-amber-50 border-amber-200 text-amber-700'">
          @if (result.allEvaluated) {
            <svg class="w-5 h-5 text-success-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            <p class="text-sm font-medium">Toutes les évaluations sont complètes ({{ result.totalEvaluators }} évaluateur(s) par candidat). La validation est possible.</p>
          } @else {
            <svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="text-sm font-medium">Évaluations en cours — {{ result.totalEvaluators }} évaluateur(s) attendu(s) par candidat. La validation est bloquée tant que toutes les évaluations ne sont pas complètes.</p>
          }
        </div>
      }

      @if (errorMsg) {
        <div class="bg-danger-50 border border-danger-200 text-danger-700 p-4 rounded-xl mb-6 text-sm">{{ errorMsg }}</div>
      }

      <div class="card overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <th class="p-4">Rang</th>
              <th class="p-4">Candidat</th>
              <th class="p-4">Score Moyen</th>
              <th class="p-4">Évaluations</th>
              <th class="p-4">Auto-Accepté</th>
              <th class="p-4">Sélection Finale</th>
              @if (isAdmin && !result.selectionFinalized) {
                <th class="p-4">Action Admin</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (cand of result.rankedCandidates; track cand.applicationId; let i = $index) {
              <tr class="hover:bg-slate-50 transition-colors" [class.bg-danger-50]="cand.overriddenBy && !cand.finalAccepted" [class.bg-success-50]="cand.overriddenBy && cand.finalAccepted">
                <td class="p-4 font-bold text-slate-500">#{{ cand.rank }}</td>
                <td class="p-4">
                  <p class="font-bold text-text-primary">{{ cand.candidateName }}</p>
                  <p class="text-xs text-text-muted">{{ cand.candidateEmail }}</p>
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold bg-primary-50 text-primary-700">
                    {{ cand.averageScore | number:'1.1-1' }}
                  </span>
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                        [class]="cand.evaluationCount >= result.totalEvaluators ? 'bg-success-50 text-success-700' : 'bg-amber-50 text-amber-700'">
                    {{ cand.evaluationCount }}/{{ result.totalEvaluators }}
                    @if (cand.evaluationCount >= result.totalEvaluators) {
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    }
                  </span>
                </td>
                <td class="p-4">
                  @if (cand.autoAccepted) {
                    <span class="text-success-600 font-bold">Oui</span>
                  } @else {
                    <span class="text-danger-500">Non</span>
                  }
                </td>
                <td class="p-4">
                  @if (cand.finalAccepted) {
                    <span class="badge-success">Sélectionné</span>
                  } @else {
                    <span class="badge-slate text-danger-600 bg-danger-50 border-danger-200">Refusé</span>
                  }
                  @if (cand.overriddenBy) {
                    <div class="text-[10px] text-text-muted mt-1 italic">
                      Modifié par {{ cand.overriddenBy }}<br>
                      Raison: "{{ cand.overrideJustification }}"
                    </div>
                  }
                </td>
                @if (isAdmin && !result.selectionFinalized) {
                  <td class="p-4">
                    <button (click)="openOverrideModal(cand)" class="btn-outline btn-sm text-xs">
                      Modifier
                    </button>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Override Modal -->
      @if (overrideModalOpen && overrideTarget) {
        <div class="overlay" (click)="overrideModalOpen = false"></div>
        <div class="slide-over p-8">
          <h2 class="text-xl font-bold mb-2">Modifier la décision</h2>
          <p class="text-sm text-text-muted mb-6">{{ overrideTarget.candidateName }}</p>

          <div class="form-group mb-4">
            <label class="label">Décision</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="decision" [value]="true" [(ngModel)]="overrideAccepted" class="text-success-600">
                <span class="font-bold text-success-600">Accepter</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="decision" [value]="false" [(ngModel)]="overrideAccepted" class="text-danger-600">
                <span class="font-bold text-danger-600">Refuser</span>
              </label>
            </div>
          </div>

          <div class="form-group mb-6">
            <label class="label">Justification obligatoire</label>
            <textarea class="input min-h-[100px]" [(ngModel)]="overrideJustification" placeholder="Raison de la modification..."></textarea>
          </div>

          <div class="flex gap-2">
            <button (click)="overrideModalOpen = false" class="btn-ghost flex-1">Annuler</button>
            <button (click)="applyOverride()" class="btn-primary flex-1" [disabled]="!overrideJustification.trim()">Confirmer</button>
          </div>
        </div>
      }
    } @else {
      <div class="p-12 text-center text-text-muted">Chargement...</div>
    }
  `
})
export class RoundSelectionComponent implements OnInit {
  result: RoundResult | null = null;
  roundId!: number;
  loading = false;
  errorMsg = '';
  
  isAdmin = false;
  isJuryPresident = false;
  
  // Override state
  overrideMap = new Map<number, { accepted: boolean, justification: string }>();
  overrideModalOpen = false;
  overrideTarget: any = null;
  overrideAccepted = false;
  overrideJustification = '';

  constructor(
    private route: ActivatedRoute,
    private appSvc: ApplicationService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.roundId = +this.route.snapshot.paramMap.get('roundId')!;
    const userRole = this.auth.userRole();
    this.isAdmin = userRole === 'ADMIN';
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.appSvc.getSelectionList(this.roundId).subscribe(res => {
      this.result = res.data || null;
      if (this.result) {
        const myEmail = this.auth.currentUser()?.email;
        this.isJuryPresident = !!this.result.juryPresident && this.result.juryPresident.email === myEmail;
        
        // Apply pending local overrides to the view
        this.overrideMap.forEach((ov, appId) => {
          const cand = this.result!.rankedCandidates.find(c => c.applicationId === appId);
          if (cand) {
            cand.finalAccepted = ov.accepted;
          }
        });
      }
      this.loading = false;
    });
  }

  goBack() {
    this.router.navigate(['../../../'], { relativeTo: this.route });
  }

  hasOverrides(): boolean {
    return this.overrideMap.size > 0;
  }

  openOverrideModal(cand: any) {
    this.overrideTarget = cand;
    this.overrideAccepted = cand.finalAccepted;
    this.overrideJustification = cand.overrideJustification || '';
    this.overrideModalOpen = true;
  }

  applyOverride() {
    if (!this.overrideTarget || !this.overrideJustification.trim()) return;
    
    // Update local view
    this.overrideTarget.finalAccepted = this.overrideAccepted;
    // Add to pending changes
    this.overrideMap.set(this.overrideTarget.applicationId, {
      accepted: this.overrideAccepted,
      justification: this.overrideJustification.trim()
    });
    
    this.overrideModalOpen = false;
    this.overrideTarget = null;
  }

  saveOverrides() {
    if (this.overrideMap.size === 0) return;
    this.loading = true;
    
    const req: SelectionOverrideRequest = {
      decisions: Array.from(this.overrideMap.entries()).map(([appId, ov]) => ({
        applicationId: appId,
        accepted: ov.accepted,
        justification: ov.justification
      }))
    };
    
    this.appSvc.overrideSelection(this.roundId, req).subscribe(res => {
      this.overrideMap.clear();
      this.result = res.data || null;
      this.loading = false;
    });
  }

  finalizeSelection() {
    if (!confirm('Êtes-vous sûr de vouloir valider cette sélection ? Cette action est irréversible et enverra des emails aux candidats.')) {
      return;
    }
    
    this.loading = true;
    this.errorMsg = '';
    this.appSvc.finalizeSelection(this.roundId).subscribe({
      next: (res) => {
        this.result = res.data || null;
        this.loading = false;
        alert('Sélection finalisée avec succès. Les emails ont été envoyés aux candidats.');
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Erreur lors de la finalisation. Vérifiez que toutes les évaluations sont complètes.';
      }
    });
  }
}
