import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramService } from '../../../core/services/program.service';
import { Program, Round } from '../../../core/models/project.model';

@Component({
  selector: 'app-admin-programs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-8">
      <div><h1 class="page-title">Programmes</h1><p class="page-subtitle">Gérez les programmes d'incubation.</p></div>
      <button (click)="openForm()" class="btn-primary btn-sm">+ Nouveau programme</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      @for (p of programs; track p.id) {
        <div class="card p-6">
          <div *ngIf="p.imagePath" class="h-32 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl bg-slate-100 border-b border-slate-100">
            <img [src]="getImageUrl(p.imagePath)" class="w-full h-full object-cover" alt="Program image">
          </div>
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-semibold">{{ p.name }}</h3>
            @if (p.active) { <span class="badge-success text-xs">Actif</span> } @else { <span class="badge-slate text-xs">Inactif</span> }
          </div>
          <p class="text-sm text-text-secondary mb-4 line-clamp-2">{{ p.description }}</p>
          <div class="flex gap-2">
            <button (click)="edit(p)" class="btn-ghost btn-sm text-xs">Modifier</button>
            <button (click)="del(p.id)" class="btn-ghost btn-sm text-xs text-danger-500">Supprimer</button>
          </div>
        </div>
      }
    </div>

    @if (showForm) {
      <div class="overlay" (click)="showForm = false"></div>
      <div class="slide-over p-8">
        <h2 class="text-xl font-bold mb-6">{{ editId ? 'Modifier' : 'Nouveau' }} programme</h2>
        <form (ngSubmit)="save()" class="space-y-5">
          <div class="form-group"><label class="label">Nom</label><input class="input" [(ngModel)]="formData.name" name="name" required></div>
          <div class="form-group"><label class="label">Description</label><textarea class="input min-h-[100px]" [(ngModel)]="formData.description" name="desc"></textarea></div>
          <div class="form-group">
            <label class="label">Image (Optionnelle)</label>
            <div class="flex items-center gap-4">
              <div *ngIf="formData.imagePath || imagePreview" class="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                <img [src]="imagePreview || getImageUrl(formData.imagePath)" alt="" class="w-full h-full object-cover">
              </div>
              <input type="file" (change)="onImageChange($event)" accept="image/*" class="input text-sm flex-1">
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" [(ngModel)]="formData.active" name="active" id="active" class="rounded">
            <label for="active" class="text-sm font-medium">Actif (Visible sur l'accueil)</label>
          </div>
          <div class="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" class="btn-ghost flex-1" (click)="showForm = false">Annuler</button>
            <button type="submit" class="btn-primary flex-1">Enregistrer</button>
          </div>
        </form>
      </div>
    }
  `
})
export class AdminProgramsComponent implements OnInit {
  programs: Program[] = [];
  showForm = false; editId: number | null = null;
  formData: any = { name: '', description: '', active: true, imagePath: null };
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  
  constructor(private svc: ProgramService) {}
  ngOnInit() { this.load(); }
  load() { this.svc.getAllPrograms().subscribe(r => { if (r.success) this.programs = r.data || []; }); }
  openForm() {
    this.editId = null;
    this.formData = { name: '', description: '', active: true, imagePath: null };
    this.selectedImage = null;
    this.imagePreview = null;
    this.showForm = true;
  }
  
  edit(p: Program) { 
    this.editId = p.id; 
    this.formData = { name: p.name, description: p.description, active: p.active, imagePath: p.imagePath }; 
    this.selectedImage = null;
    this.imagePreview = null;
    this.showForm = true; 
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

  save() {
    const obs = this.editId 
      ? this.svc.updateProgram(this.editId, this.formData, this.selectedImage || undefined) 
      : this.svc.createProgram(this.formData, this.selectedImage || undefined);
    obs.subscribe({
      next: () => { this.showForm = false; this.load(); },
      error: (err) => { alert('Erreur lors de la sauvegarde: ' + err.message); }
    });
  }
  
  del(id: number) { 
    if (confirm('Voulez-vous vraiment supprimer ce programme ? Cela supprimera également tous les rounds et projets associés.')) {
      this.svc.deleteProgram(id).subscribe({
        next: () => this.load(),
        error: (err) => alert("Impossible de supprimer ce programme car il est lié à d'autres éléments (ex: projets avec évaluations). " + err.message)
      });
    }
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('assets/')) return path;
    return 'http://localhost:8085/api/files/download/' + path;
  }
}
