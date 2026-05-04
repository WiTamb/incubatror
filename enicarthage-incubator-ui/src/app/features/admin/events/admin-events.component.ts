import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { Event, EventRegistration } from '../../../core/models/index';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-8">
      <div><h1 class="page-title">Événements</h1><p class="page-subtitle">Gérez les événements.</p></div>
      <button (click)="openForm()" class="btn-primary btn-sm">+ Nouvel événement</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      @for (e of events; track e.id) {
        <div class="card p-6 flex flex-col h-full relative overflow-hidden">
          <div *ngIf="e.imagePath" class="h-32 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl bg-slate-100 border-b border-slate-100 relative">
            <img [src]="getImageUrl(e.imagePath)" class="w-full h-full object-cover" alt="Event image">
            @if (e.registrationEnabled) {
              <div class="absolute top-0 right-0 bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-primary-200">
                Inscriptions Ouvertes
              </div>
            }
          </div>
          @if (!e.imagePath && e.registrationEnabled) {
            <div class="absolute top-0 right-0 bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-primary-200">
              Inscriptions Ouvertes
            </div>
          }
          <h3 class="font-bold text-lg mb-2 text-slate-800 pr-16">{{ e.title }}</h3>
          <p class="text-sm text-slate-600 mb-4 line-clamp-3 whitespace-pre-line flex-grow">{{ e.description }}</p>
          <div class="space-y-1 mb-6">
            @if (e.eventDate) {
              <div class="flex items-center text-xs text-slate-500">
                <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {{ e.eventDate | date:'dd/MM/yyyy HH:mm' }}
              </div>
            }
            @if (e.location) {
              <div class="flex items-center text-xs text-slate-500">
                <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                {{ e.location }}
              </div>
            }
            @if (e.registrationEnabled) {
              <div class="flex items-center text-xs text-slate-500">
                <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                Places limitées : {{ e.maxParticipants ? e.maxParticipants : 'Illimité' }}
              </div>
            }
          </div>
          
          <div class="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            @if (e.registrationEnabled) {
              <button (click)="viewParticipants(e)" class="btn-primary btn-sm flex-1 text-xs">Participants</button>
            }
            <button (click)="edit(e)" class="btn-ghost btn-sm text-xs bg-slate-50 hover:bg-slate-100">Modifier</button>
            <button (click)="del(e.id)" class="btn-ghost btn-sm text-xs text-danger-500 bg-danger-50 hover:bg-danger-100">Supprimer</button>
          </div>
        </div>
      }
    </div>

    @if (showForm) {
      <div class="overlay" (click)="showForm = false"></div>
      <div class="slide-over p-8 overflow-y-auto">
        <h2 class="text-xl font-bold mb-6">{{ editId ? 'Modifier' : 'Nouvel' }} événement</h2>
        <form (ngSubmit)="save()" class="space-y-5">
          <div class="form-group"><label class="label">Titre</label><input class="input" [(ngModel)]="fd.title" name="t" required></div>
          <div class="form-group"><label class="label">Description (multiligne supporté)</label><textarea class="input min-h-[150px]" [(ngModel)]="fd.description" name="d" placeholder="Description détaillée de l'événement..."></textarea></div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group"><label class="label">Date & Heure</label><input type="datetime-local" class="input" [(ngModel)]="fd.eventDate" name="dt"></div>
            <div class="form-group"><label class="label">Lieu</label><input class="input" [(ngModel)]="fd.location" name="l" placeholder="En ligne ou adresse"></div>
          </div>

          <div class="form-group">
            <label class="label">Image de l'événement (Optionnelle)</label>
            <div class="flex items-center gap-4">
              <div *ngIf="fd.imagePath || imagePreview" class="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                <img [src]="imagePreview || getImageUrl(fd.imagePath)" alt="" class="w-full h-full object-cover">
              </div>
              <input type="file" (change)="onImageChange($event)" accept="image/*" class="input text-sm flex-1">
            </div>
          </div>

          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-6">
            <h3 class="font-bold text-sm text-slate-700 mb-4">Gestion des inscriptions</h3>
            
            <label class="flex items-center cursor-pointer mb-4">
              <div class="relative">
                <input type="checkbox" class="sr-only" [(ngModel)]="fd.registrationEnabled" name="re">
                <div class="block bg-slate-300 w-10 h-6 rounded-full" [class.bg-primary-500]="fd.registrationEnabled"></div>
                <div class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition" [class.translate-x-4]="fd.registrationEnabled"></div>
              </div>
              <div class="ml-3 text-sm font-medium text-slate-700">Activer le formulaire d'inscription</div>
            </label>

            @if (fd.registrationEnabled) {
              <div class="form-group mt-3">
                <label class="label text-xs">Nombre de places max (laissez vide si illimité)</label>
                <input type="number" class="input" [(ngModel)]="fd.maxParticipants" name="mp" min="1" placeholder="Ex: 50">
              </div>
            }
          </div>

          <div class="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" class="btn-ghost flex-1" (click)="showForm = false">Annuler</button>
            <button type="submit" class="btn-primary flex-1">Enregistrer</button>
          </div>
        </form>
      </div>
    }

    <!-- Participants Modal -->
    @if (showParticipants) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-xl font-bold">Participants inscrits</h2>
              <p class="text-sm text-slate-500">{{ selectedEvent?.title }}</p>
            </div>
            <button (click)="showParticipants = false" class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2">✕</button>
          </div>
          
          <div class="flex-1 overflow-y-auto min-h-[300px]">
            @if (loadingParticipants) {
              <div class="flex items-center justify-center h-full text-slate-400">Chargement...</div>
            } @else if (participants.length === 0) {
              <div class="flex items-center justify-center h-full text-slate-400">Aucun participant inscrit pour le moment.</div>
            } @else {
              <div class="table-container">
                <table class="w-full">
                  <thead>
                    <tr class="table-header">
                      <th class="px-4 py-3 text-left">Utilisateur</th>
                      <th class="px-4 py-3 text-left">Email</th>
                      <th class="px-4 py-3 text-left">Date d'inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of participants; track p.id) {
                      <tr class="table-row">
                        <td class="px-4 py-3 font-medium">{{ p.user?.firstName }} {{ p.user?.lastName }}</td>
                        <td class="px-4 py-3 text-sm text-slate-500">{{ p.user?.email }}</td>
                        <td class="px-4 py-3 text-sm text-slate-500">{{ p.registeredAt | date:'dd/MM/yyyy HH:mm' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
          <div class="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
            <span class="font-bold text-slate-700">Total : {{ participants.length }} inscrit(s)</span>
            <span class="text-slate-500" *ngIf="selectedEvent?.maxParticipants">Places max : {{ selectedEvent?.maxParticipants }}</span>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminEventsComponent implements OnInit {
  events: Event[] = []; showForm = false; editId: number | null = null;
  fd: any = { title: '', description: '', location: '', eventDate: '', registrationEnabled: false, maxParticipants: null, imagePath: null };
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  
  showParticipants = false;
  selectedEvent: Event | null = null;
  participants: EventRegistration[] = [];
  loadingParticipants = false;

  constructor(private svc: EventService) {}
  ngOnInit() { this.load(); }
  load() { this.svc.getAllEvents().subscribe(r => { if (r.success) this.events = r.data || []; }); }
  
  openForm() { 
    this.editId = null; 
    this.fd = { title: '', description: '', location: '', eventDate: '', registrationEnabled: false, maxParticipants: null, imagePath: null }; 
    this.selectedImage = null;
    this.imagePreview = null;
    this.showForm = true; 
  }
  
  edit(e: Event) { 
    this.editId = e.id; 
    this.fd = { 
      title: e.title, 
      description: e.description, 
      location: e.location, 
      eventDate: e.eventDate,
      registrationEnabled: e.registrationEnabled || false,
      maxParticipants: e.maxParticipants || null,
      imagePath: e.imagePath
    }; 
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
    // Clean maxParticipants if registration is disabled or field is empty
    if (!this.fd.registrationEnabled) this.fd.maxParticipants = null;
    if (this.fd.maxParticipants === '') this.fd.maxParticipants = null;

    const obs = this.editId 
      ? this.svc.updateEvent(this.editId, this.fd, this.selectedImage || undefined) 
      : this.svc.createEvent(this.fd, this.selectedImage || undefined);
    obs.subscribe(() => { this.showForm = false; this.load(); });
  }
  
  del(id: number) { 
    if (confirm('Supprimer cet événement ?')) {
      this.svc.deleteEvent(id).subscribe({
        next: () => this.load(),
        error: (err) => alert('Erreur: ' + err.message)
      });
    }
  }

  viewParticipants(e: Event) {
    this.selectedEvent = e;
    this.showParticipants = true;
    this.loadingParticipants = true;
    this.participants = [];
    this.svc.getEventParticipants(e.id).subscribe({
      next: (res) => {
        if (res.success) this.participants = res.data || [];
        this.loadingParticipants = false;
      },
      error: (err) => {
        console.error("Erreur récupération participants:", err);
        alert("Erreur lors de la récupération des participants: " + (err.error?.message || err.message));
        this.loadingParticipants = false;
      }
    });
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('assets/')) return path;
    return 'http://localhost:8085/api/files/download/' + path;
  }
}
