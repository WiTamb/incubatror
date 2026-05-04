import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService } from '../../../core/services/news.service';
import { News } from '../../../core/models/index';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-8">
      <div><h1 class="page-title">Actualités</h1><p class="page-subtitle">Gérez les articles et actualités.</p></div>
      <button (click)="openForm()" class="btn-primary btn-sm">+ Nouvel article</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      @for (n of news; track n.id) {
        <div class="card p-6 flex flex-col h-full relative overflow-hidden">
          <div *ngIf="n.imagePath" class="h-32 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl bg-slate-100 border-b border-slate-100 relative">
            <img [src]="getImageUrl(n.imagePath)" class="w-full h-full object-cover" alt="News image">
          </div>
          <h3 class="font-semibold mb-2">{{ n.title }}</h3>
          <p class="text-sm text-text-secondary mb-2 line-clamp-2">{{ n.content }}</p>
          <p class="text-xs text-text-muted mb-3">{{ n.createdAt | date:'dd/MM/yyyy' }}</p>
          <div class="flex gap-2">
            <button (click)="edit(n)" class="btn-ghost btn-sm text-xs">Modifier</button>
            <button (click)="del(n.id)" class="btn-ghost btn-sm text-xs text-danger-500">Supprimer</button>
          </div>
        </div>
      }
    </div>
    @if (showForm) {
      <div class="overlay" (click)="showForm = false"></div>
      <div class="slide-over p-8">
        <h2 class="text-xl font-bold mb-6">{{ editId ? 'Modifier' : 'Nouvel' }} article</h2>
        <form (ngSubmit)="save()" class="space-y-5">
          <div class="form-group"><label class="label">Titre</label><input class="input" [(ngModel)]="fd.title" name="t" required></div>
          <div class="form-group"><label class="label">Contenu</label><textarea class="input min-h-[150px]" [(ngModel)]="fd.content" name="c"></textarea></div>
          <div class="form-group"><label class="label">Catégorie</label><input class="input" [(ngModel)]="fd.category" name="cat"></div>
          <div class="form-group">
            <label class="label">Image (Optionnelle)</label>
            <div class="flex items-center gap-4">
              <div *ngIf="fd.imagePath || imagePreview" class="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                <img [src]="imagePreview || getImageUrl(fd.imagePath)" alt="" class="w-full h-full object-cover">
              </div>
              <input type="file" (change)="onImageChange($event)" accept="image/*" class="input text-sm flex-1">
            </div>
          </div>
          <button type="submit" class="btn-primary btn-md w-full">Enregistrer</button>
        </form>
      </div>
    }
  `
})
export class AdminNewsComponent implements OnInit {
  news: News[] = []; showForm = false; editId: number | null = null;
  fd: any = { title: '', content: '', category: '', imagePath: null };
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  constructor(private svc: NewsService) {}
  ngOnInit() { this.load(); }
  load() { this.svc.getAllNews().subscribe(r => { if (r.success) this.news = r.data || []; }); }
  openForm() { 
    this.editId = null; 
    this.fd = { title: '', content: '', category: '', imagePath: null }; 
    this.selectedImage = null;
    this.imagePreview = null;
    this.showForm = true; 
  }
  
  edit(n: News) { 
    this.editId = n.id; 
    this.fd = { title: n.title, content: n.content, category: n.category, imagePath: n.imagePath }; 
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
      ? this.svc.updateNews(this.editId, this.fd, this.selectedImage || undefined) 
      : this.svc.createNews(this.fd, this.selectedImage || undefined);
    obs.subscribe(() => { this.showForm = false; this.load(); });
  }
  
  del(id: number) { 
    if (confirm('Voulez-vous vraiment supprimer cet article ?')) {
      this.svc.deleteNews(id).subscribe({
        next: () => this.load(),
        error: (err) => alert('Erreur: ' + err.message)
      });
    }
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('assets/')) return path;
    return 'http://localhost:8085/api/files/download/' + path;
  }
}
