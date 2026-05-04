import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LandingSectionService, LandingSection } from '../../../core/services/landing-section.service';

@Component({
  selector: 'app-admin-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title mb-2">Page d'Accueil</h1>
          <p class="page-subtitle">Gérez les sections de la page d'accueil publique.</p>
        </div>
        <button (click)="openForm()" class="btn-primary flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          Ajouter une section
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && sections.length === 0" class="card p-12 text-center bg-white/50 border-dashed border-2">
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
        </div>
        <h3 class="text-lg font-bold text-text-primary mb-2">Aucune section</h3>
        <p class="text-text-muted text-sm">Ajoutez votre première section pour personnaliser la page d'accueil.</p>
      </div>

      <!-- Sections List -->
      <div *ngIf="!loading && sections.length > 0" class="space-y-4">
        <div *ngFor="let section of sections; let i = index" 
             class="card p-6 bg-white hover:shadow-lg transition-all group"
             [class.opacity-50]="!section.visible">
          <div class="flex items-start gap-6">
            <!-- Order controls -->
            <div class="flex flex-col items-center gap-1 pt-1">
              <button (click)="moveUp(i)" [disabled]="i === 0" 
                      class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>
              </button>
              <span class="text-xs font-bold text-text-muted w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">{{ section.orderIndex }}</span>
              <button (click)="moveDown(i)" [disabled]="i === sections.length - 1" 
                      class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </button>
            </div>

            <!-- Thumbnail -->
            <div *ngIf="section.imagePath" class="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
              <img [src]="getImageUrl(section.imagePath)" alt="" class="w-full h-full object-cover">
            </div>
            <div *ngIf="!section.imagePath" class="w-24 h-24 rounded-xl flex-shrink-0 bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
              <svg class="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <h3 class="font-bold text-text-primary text-lg truncate">{{ section.title }}</h3>
                <span *ngIf="!section.visible" class="badge bg-slate-100 text-slate-500 text-[10px]">Masquée</span>
              </div>
              <p *ngIf="section.subtitle" class="text-xs text-primary-600 font-semibold mb-2">{{ section.subtitle }}</p>
              <p class="text-sm text-text-secondary line-clamp-2">{{ section.content }}</p>
              <div class="flex items-center gap-3 mt-3">
                <span class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      [ngClass]="{
                        'bg-white border border-slate-200 text-slate-600': section.backgroundColor === 'white',
                        'bg-slate-100 text-slate-600': section.backgroundColor === 'background',
                        'bg-navy-900 text-white': section.backgroundColor === 'navy',
                        'bg-gradient-to-r from-primary-500 to-primary-600 text-white': section.backgroundColor === 'gradient'
                      }">
                  {{ section.backgroundColor }}
                </span>
                <span class="text-[10px] text-text-muted bg-slate-50 px-2 py-0.5 rounded-full">{{ section.layout }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button (click)="toggleVisibility(section)" 
                      class="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                      [class.text-success-500]="section.visible"
                      [class.text-slate-400]="!section.visible"
                      [title]="section.visible ? 'Masquer' : 'Afficher'">
                <svg *ngIf="section.visible" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <svg *ngIf="!section.visible" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
              </button>
              <button (click)="editSection(section)" class="p-2 rounded-xl hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors" title="Modifier">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button (click)="confirmDelete(section)" class="p-2 rounded-xl hover:bg-danger-50 text-text-muted hover:text-danger-500 transition-colors" title="Supprimer">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Slide-over -->
      <div *ngIf="showForm" class="overlay" (click)="closeForm()"></div>
      <div *ngIf="showForm" class="slide-over p-8 w-full max-w-2xl overflow-y-auto">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-xl font-black text-text-primary">{{ editing ? 'Modifier la section' : 'Nouvelle section' }}</h2>
          <button (click)="closeForm()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-text-muted">✕</button>
        </div>

        <div class="space-y-6">
          <div class="form-group">
            <label class="label">Titre <span class="text-danger-500">*</span></label>
            <input type="text" class="input" [(ngModel)]="form.title" placeholder="Titre de la section">
          </div>

          <div class="form-group">
            <label class="label">Sous-titre / Date</label>
            <input type="text" class="input" [(ngModel)]="form.subtitle" placeholder="Ex: November 12, 2025">
          </div>

          <div class="form-group">
            <label class="label">Contenu <span class="text-danger-500">*</span></label>
            <textarea class="input" rows="8" [(ngModel)]="form.content" placeholder="Texte de la section..."></textarea>
          </div>

          <div class="form-group">
            <label class="label">Image</label>
            <div class="flex items-center gap-4">
              <div *ngIf="form.imagePath || imagePreview" class="w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                <img [src]="imagePreview || getImageUrl(form.imagePath!)" alt="" class="w-full h-full object-cover">
              </div>
              <div class="flex-1">
                <input type="file" (change)="onImageChange($event)" accept="image/*" class="input text-sm">
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="label">Couleur de fond</label>
              <select class="input" [(ngModel)]="form.backgroundColor">
                <option value="white">Blanc</option>
                <option value="background">Gris clair</option>
                <option value="navy">Bleu marine</option>
                <option value="gradient">Dégradé bleu</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">Disposition</label>
              <select class="input" [(ngModel)]="form.layout">
                <option value="text-left-image-right">Texte à gauche, Image à droite</option>
                <option value="image-left-text-right">Image à gauche, Texte à droite</option>
                <option value="centered">Centré</option>
                <option value="two-columns">Deux colonnes</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" [(ngModel)]="form.visible" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
            <span class="text-sm font-medium text-text-primary">Visible sur la page d'accueil</span>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button (click)="closeForm()" class="btn-ghost">Annuler</button>
            <button (click)="saveSection()" [disabled]="saving || !form.title || !form.content" class="btn-primary">
              <span *ngIf="saving" class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              {{ editing ? 'Enregistrer' : 'Créer la section' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <div *ngIf="deleteTarget" class="overlay" (click)="deleteTarget = null"></div>
      <div *ngIf="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div class="w-14 h-14 bg-danger-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h3 class="text-lg font-bold text-text-primary text-center mb-2">Supprimer cette section ?</h3>
          <p class="text-sm text-text-muted text-center mb-6">La section "{{ deleteTarget.title }}" sera définitivement supprimée.</p>
          <div class="flex gap-3">
            <button (click)="deleteTarget = null" class="btn-ghost flex-1">Annuler</button>
            <button (click)="deleteSection()" class="btn bg-danger-500 text-white hover:bg-danger-600 flex-1">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminLandingComponent implements OnInit {
  sections: LandingSection[] = [];
  loading = true;
  showForm = false;
  editing = false;
  editingId: number | null = null;
  saving = false;
  deleteTarget: LandingSection | null = null;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  form: LandingSection = this.emptyForm();

  constructor(private sectionService: LandingSectionService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.sectionService.getAllSections().subscribe({
      next: res => { this.sections = res.data || []; this.loading = false; },
      error: () => this.loading = false
    });
  }

  emptyForm(): LandingSection {
    return { title: '', subtitle: '', content: '', imagePath: null, backgroundColor: 'white', layout: 'text-left-image-right', orderIndex: 0, visible: true };
  }

  openForm() {
    this.form = this.emptyForm();
    this.editing = false;
    this.editingId = null;
    this.selectedImage = null;
    this.imagePreview = null;
    this.showForm = true;
  }

  editSection(section: LandingSection) {
    this.form = { ...section };
    this.editing = true;
    this.editingId = section.id!;
    this.selectedImage = null;
    this.imagePreview = null;
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  saveSection() {
    this.saving = true;
    if (this.editing && this.editingId) {
      this.sectionService.update(this.editingId, this.form, this.selectedImage || undefined).subscribe({
        next: () => { this.saving = false; this.closeForm(); this.load(); },
        error: () => { this.saving = false; alert('Erreur lors de la mise à jour.'); }
      });
    } else {
      this.sectionService.create(this.form, this.selectedImage || undefined).subscribe({
        next: () => { this.saving = false; this.closeForm(); this.load(); },
        error: () => { this.saving = false; alert('Erreur lors de la création.'); }
      });
    }
  }

  toggleVisibility(section: LandingSection) {
    const updated = { ...section, visible: !section.visible };
    this.sectionService.update(section.id!, updated).subscribe(() => this.load());
  }

  moveUp(index: number) {
    if (index === 0) return;
    const ids = this.sections.map(s => s.id!);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    this.sectionService.reorder(ids).subscribe(() => this.load());
  }

  moveDown(index: number) {
    if (index === this.sections.length - 1) return;
    const ids = this.sections.map(s => s.id!);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    this.sectionService.reorder(ids).subscribe(() => this.load());
  }

  confirmDelete(section: LandingSection) {
    this.deleteTarget = section;
  }

  deleteSection() {
    if (!this.deleteTarget) return;
    this.sectionService.delete(this.deleteTarget.id!).subscribe(() => {
      this.deleteTarget = null;
      this.load();
    });
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('assets/')) return path;
    return 'http://localhost:8085/api/files/download/' + path;
  }
}
