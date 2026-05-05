import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-evaluator-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-background flex">
      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.translate-x-0]="sidebarOpen()">

        <div class="h-16 flex items-center gap-2.5 px-6 border-b border-slate-100">
          <img src="assets/images/logo.png" alt="Logo" class="h-8 w-auto object-contain">
          <span class="text-sm font-bold font-display text-text-primary">Évaluateur</span>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <span class="px-4 text-[10px] font-semibold text-text-muted uppercase tracking-widest">Évaluation</span>
          <a routerLink="/evaluator" routerLinkActive="sidebar-link-active" [routerLinkActiveOptions]="{exact:true}" class="sidebar-link">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Tableau de bord
          </a>
          <a routerLink="/evaluator/sessions" routerLinkActive="sidebar-link-active" class="sidebar-link">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Sessions
          </a>
          <a routerLink="/evaluator/profile" routerLinkActive="sidebar-link-active" class="sidebar-link">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Mon Profil
          </a>

          <div class="mt-4 pt-4 border-t border-slate-100">
            <a routerLink="/" class="sidebar-link text-text-muted hover:text-primary-600 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Retour à l'accueil
            </a>
          </div>
        </nav>

        <div class="p-4 border-t border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-semibold">
              {{ auth.userInitials() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-text-primary truncate">{{ auth.userName() }}</p>
              <p class="text-xs text-text-muted">Évaluateur</p>
            </div>
            <button (click)="auth.logout()" class="text-text-muted hover:text-danger-500 transition-colors" title="Déconnexion">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </aside>

      <div class="flex-1 ml-0 lg:ml-64">
        <header class="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <button (click)="sidebarOpen.set(!sidebarOpen())" class="lg:hidden text-text-secondary">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div class="flex items-center gap-2">
            <span class="text-sm text-text-muted">Espace</span>
            <span class="badge bg-accent-100 text-accent-700">Évaluateur</span>
          </div>
          <div class="flex items-center gap-4">
            @if (auth.userRole() === 'ADMIN') {
              <a routerLink="/admin" class="btn-ghost btn-sm flex items-center gap-2 text-primary-600 hover:bg-primary-50 font-medium">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                Basculer vers Administrateur
              </a>
            }
          </div>
        </header>

        <main class="p-6 lg:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>

      @if (sidebarOpen()) {
        <div class="fixed inset-0 bg-black/20 z-30 lg:hidden" (click)="sidebarOpen.set(false)"></div>
      }
    </div>
  `
})
export class EvaluatorLayoutComponent {
  sidebarOpen = signal(true);
  constructor(public auth: AuthService) {}
}
