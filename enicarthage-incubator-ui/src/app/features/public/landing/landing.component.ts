import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProgramService } from '../../../core/services/program.service';
import { EventService } from '../../../core/services/event.service';
import { NewsService } from '../../../core/services/news.service';
import { LandingSectionService, LandingSection } from '../../../core/services/landing-section.service';
import { Program } from '../../../core/models/project.model';
import { Event, News } from '../../../core/models/index';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Hero Carousel -->
    <section class="relative w-full h-[80vh] overflow-hidden bg-navy-950">
      @for (slide of slides; track slide; let i = $index) {
        <div class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
             [class.opacity-100]="i === currentSlide"
             [class.z-10]="i === currentSlide"
             [class.opacity-0]="i !== currentSlide"
             [class.z-0]="i !== currentSlide">
          <img [src]="slide" class="w-full h-full object-cover opacity-60" alt="Incubator Event">
        </div>
      }
      
      <div class="absolute inset-0 z-20 flex flex-col items-center justify-center pt-32 text-center px-4">
        <h1 class="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white font-display leading-tight max-w-5xl drop-shadow-lg">
          Catalyzing <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-600">Innovation</span><br/>
          Growing Ideas
        </h1>
        <p class="mt-6 text-xl text-slate-200 max-w-2xl font-light drop-shadow">
          From Engineering to Entrepreneurship. Transforming ideas into real projects and impactful startups.
        </p>
        <div class="mt-12 flex items-center gap-4">
          <a href="#about" class="btn bg-white text-navy-900 hover:bg-slate-100 btn-lg font-bold shadow-xl">
            Discover Our Story
          </a>
        </div>
      </div>

      <!-- Carousel Navigation -->
      <div class="absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-3">
        @for (slide of slides; track slide; let i = $index) {
          <button (click)="setSlide(i)" 
                  [ngClass]="i === currentSlide ? 'bg-white scale-125' : 'bg-white/40'"
                  class="w-3 h-3 rounded-full transition-all duration-300">
          </button>
        }
      </div>
    </section>

    <!-- Dynamic Sections from API -->
    @for (section of dynamicSections; track section.id; let i = $index) {
      <section [id]="i === 0 ? 'about' : ''"
               class="py-24"
               [ngClass]="{
                 'bg-white': section.backgroundColor === 'white',
                 'bg-background border-y border-slate-100': section.backgroundColor === 'background',
                 'bg-navy-900 text-white': section.backgroundColor === 'navy',
                 'bg-gradient-to-r from-primary-600 to-primary-700 text-white': section.backgroundColor === 'gradient'
               }">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <!-- Layout: text-left-image-right -->
          <div *ngIf="section.layout === 'text-left-image-right'" class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span *ngIf="section.subtitle" class="text-primary-600 font-bold tracking-wider uppercase text-sm mb-2 block"
                    [class.text-primary-300]="section.backgroundColor === 'navy' || section.backgroundColor === 'gradient'">
                {{ section.subtitle }}
              </span>
              <h2 class="text-3xl sm:text-4xl font-bold font-display mb-6"
                  [class.text-text-primary]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                  [class.text-white]="section.backgroundColor === 'navy' || section.backgroundColor === 'gradient'">
                {{ section.title }}
              </h2>
              <div class="space-y-4 text-lg leading-relaxed whitespace-pre-line"
                   [class.text-text-secondary]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                   [class.text-slate-300]="section.backgroundColor === 'navy'"
                   [class.text-primary-100]="section.backgroundColor === 'gradient'">
                {{ section.content }}
              </div>
            </div>
            <div *ngIf="section.imagePath" class="relative">
              <div class="absolute inset-0 bg-gradient-to-tr from-primary-100 to-accent-100 transform translate-x-4 translate-y-4 rounded-3xl -z-10"></div>
              <img [src]="getImageUrl(section.imagePath)" alt="" class="rounded-3xl shadow-xl w-full object-cover h-[500px]">
            </div>
          </div>

          <!-- Layout: image-left-text-right -->
          <div *ngIf="section.layout === 'image-left-text-right'" class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div *ngIf="section.imagePath" class="relative">
              <div class="absolute inset-0 bg-gradient-to-bl from-accent-100 to-primary-100 transform -translate-x-4 translate-y-4 rounded-3xl -z-10"></div>
              <img [src]="getImageUrl(section.imagePath)" alt="" class="rounded-3xl shadow-xl w-full object-cover h-[500px]">
            </div>
            <div>
              <span *ngIf="section.subtitle" class="font-bold tracking-wider uppercase text-sm mb-2 block"
                    [class.text-accent-600]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                    [class.text-primary-300]="section.backgroundColor === 'navy' || section.backgroundColor === 'gradient'">
                {{ section.subtitle }}
              </span>
              <h2 class="text-3xl sm:text-4xl font-bold font-display mb-6"
                  [class.text-text-primary]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                  [class.text-white]="section.backgroundColor === 'navy' || section.backgroundColor === 'gradient'">
                {{ section.title }}
              </h2>
              <div class="space-y-4 text-lg leading-relaxed whitespace-pre-line"
                   [class.text-text-secondary]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                   [class.text-slate-300]="section.backgroundColor === 'navy'"
                   [class.text-primary-100]="section.backgroundColor === 'gradient'">
                {{ section.content }}
              </div>
            </div>
          </div>

          <!-- Layout: centered -->
          <div *ngIf="section.layout === 'centered'" class="text-center max-w-4xl mx-auto">
            <span *ngIf="section.subtitle" class="font-bold tracking-wider uppercase text-sm mb-4 block"
                  [class.text-primary-600]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                  [class.text-primary-300]="section.backgroundColor === 'navy' || section.backgroundColor === 'gradient'">
              {{ section.subtitle }}
            </span>
            <h2 class="text-3xl sm:text-4xl font-bold font-display mb-8"
                [class.text-text-primary]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                [class.text-white]="section.backgroundColor === 'navy' || section.backgroundColor === 'gradient'">
              {{ section.title }}
            </h2>
            <div *ngIf="section.imagePath" class="mb-8">
              <img [src]="getImageUrl(section.imagePath)" alt="" class="rounded-3xl shadow-xl max-h-[400px] mx-auto object-cover">
            </div>
            <div class="text-lg leading-relaxed whitespace-pre-line"
                 [class.text-text-secondary]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                 [class.text-slate-300]="section.backgroundColor === 'navy'"
                 [class.text-primary-100]="section.backgroundColor === 'gradient'">
              {{ section.content }}
            </div>
          </div>

          <!-- Layout: two-columns -->
          <div *ngIf="section.layout === 'two-columns'">
            <h2 class="text-3xl sm:text-4xl font-bold font-display mb-8 text-center"
                [class.text-text-primary]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                [class.text-white]="section.backgroundColor === 'navy' || section.backgroundColor === 'gradient'">
              {{ section.title }}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
              <div class="p-8 rounded-3xl border"
                   [class.bg-white]="section.backgroundColor === 'background'"
                   [class.bg-slate-50]="section.backgroundColor === 'white'"
                   [class.bg-navy-800]="section.backgroundColor === 'navy'"
                   [class.border-slate-100]="section.backgroundColor !== 'navy'"
                   [class.border-navy-700]="section.backgroundColor === 'navy'">
                <div class="text-lg leading-relaxed whitespace-pre-line"
                     [class.text-text-secondary]="section.backgroundColor === 'white' || section.backgroundColor === 'background'"
                     [class.text-slate-300]="section.backgroundColor === 'navy'">
                  {{ section.content }}
                </div>
              </div>
              <div *ngIf="section.imagePath" class="relative">
                <img [src]="getImageUrl(section.imagePath)" alt="" class="rounded-3xl shadow-xl w-full object-cover h-full">
              </div>
            </div>
          </div>
        </div>
      </section>
    }

    <!-- Events -->
    @if (events.length > 0) {
      <section id="events" class="py-24 bg-white border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <span class="badge-primary mb-4 bg-primary-100 text-primary-700">Événements</span>
            <h2 class="text-3xl sm:text-4xl font-bold text-text-primary font-display">À ne pas manquer</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (e of events; track e.id) {
              <div class="card overflow-hidden group flex flex-col h-full border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                @if (e.imagePath) {
                  <div class="h-48 overflow-hidden relative">
                    <img [src]="getImageUrl(e.imagePath)" alt="{{ e.title }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    @if (e.registrationEnabled) {
                      <div class="absolute top-0 right-0 bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-primary-200 z-10">
                        Inscriptions Ouvertes
                      </div>
                    }
                  </div>
                }
                <div class="p-6 flex flex-col h-full relative">
                  @if (!e.imagePath && e.registrationEnabled) {
                    <div class="absolute top-0 right-0 bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-primary-200">
                      Inscriptions Ouvertes
                    </div>
                  }
                  <h3 class="text-xl font-bold text-slate-800 mb-3 pr-16">{{ e.title }}</h3>
                  <p class="text-sm text-slate-600 mb-6 line-clamp-3 whitespace-pre-line flex-grow">{{ e.description }}</p>
                  
                  <div class="space-y-2 mb-6 bg-slate-50 p-4 rounded-xl">
                    @if (e.eventDate) {
                      <div class="flex items-center text-sm text-slate-600 font-medium">
                        <svg class="w-5 h-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {{ e.eventDate | date:'dd/MM/yyyy à HH:mm' }}
                      </div>
                    }
                    @if (e.location) {
                      <div class="flex items-center text-sm text-slate-600 font-medium">
                        <svg class="w-5 h-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        {{ e.location }}
                      </div>
                    }
                  </div>

                  @if (e.registrationEnabled) {
                    <div class="mt-auto">
                      <a routerLink="/login" class="btn-primary w-full text-center flex items-center justify-center">
                        S'inscrire (Candidat / Étudiant)
                        <svg class="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                      </a>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </section>
    }

    <!-- Programs -->
    <section id="programs" class="py-24 bg-background">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <span class="badge-primary mb-4">Programmes</span>
          <h2 class="text-3xl sm:text-4xl font-bold text-text-primary font-display">Nos programmes d'incubation</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          @for (program of programs; track program.id) {
            <div class="card overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div class="h-3 bg-gradient-to-r from-primary-500 to-accent-500"></div>
              <div class="p-8">
                <div class="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 text-primary-600">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                </div>
                <h3 class="text-xl font-bold text-text-primary mb-3">{{ program.name }}</h3>
                <p class="text-sm text-text-secondary leading-relaxed mb-6">{{ program.description || 'Programme d\\'incubation innovant pour les étudiants et futurs entrepreneurs.' }}</p>
                <div class="flex items-center text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg w-max">
                  <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  Programme Actif
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- News -->
    @if (newsList.length > 0) {
      <section id="news" class="py-24 bg-white border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <span class="badge-primary mb-4 bg-accent-100 text-accent-700">Actualités</span>
            <h2 class="text-3xl sm:text-4xl font-bold text-text-primary font-display">Dernières nouvelles</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @for (news of newsList; track news.id) {
              <div class="card overflow-hidden group hover:shadow-xl transition-all duration-300">
                @if (news.imagePath) {
                  <div class="h-48 overflow-hidden">
                    <img [src]="getImageUrl(news.imagePath)" alt="{{ news.title }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  </div>
                } @else {
                  <div class="h-48 bg-slate-100 flex items-center justify-center">
                    <svg class="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                  </div>
                }
                <div class="p-6">
                  <div class="flex items-center gap-2 mb-4">
                    @if (news.category) {
                      <span class="text-xs font-bold uppercase text-accent-600 tracking-wider">{{ news.category }}</span>
                      <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    }
                    <span class="text-xs font-medium text-slate-500">{{ news.createdAt | date:'longDate' }}</span>
                  </div>
                  <h3 class="text-xl font-bold text-slate-800 mb-3 group-hover:text-primary-600 transition-colors">{{ news.title }}</h3>
                  <p class="text-sm text-slate-600 line-clamp-3 leading-relaxed">{{ news.content }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>
    }

    <!-- CTA -->
    <section class="py-24 bg-gradient-to-r from-primary-600 to-primary-700">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl sm:text-4xl font-bold text-white font-display">Prêt à rejoindre l'aventure ?</h2>
        <p class="mt-4 text-primary-100 text-lg max-w-2xl mx-auto">Créez votre compte pour être prêt lors de la prochaine session d'incubation.</p>
        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a routerLink="/register" class="btn bg-white text-primary-700 hover:bg-primary-50 btn-lg font-semibold shadow-lg">
            Créer mon compte
          </a>
        </div>
      </div>
    </section>
  `
})
export class LandingComponent implements OnInit, OnDestroy {
  programs: Program[] = [];
  events: Event[] = [];
  newsList: News[] = [];
  dynamicSections: LandingSection[] = [];
  
  // Carousel logic
  slides = [
    'assets/images/slide1.png',
    'assets/images/slide2.png',
    'assets/images/slide3.png'
  ];
  currentSlide = 0;
  slideInterval: any;

  constructor(
    private programService: ProgramService,
    private eventService: EventService,
    private newsService: NewsService,
    private landingSectionService: LandingSectionService
  ) {}

  ngOnInit() {
    this.programService.getActivePrograms().subscribe(res => {
      if (res.success) this.programs = res.data || [];
    });

    this.eventService.getPublishedEvents().subscribe(res => {
      if (res.success) this.events = res.data || [];
    });

    this.newsService.getPublishedNews().subscribe(res => {
      if (res.success) this.newsList = res.data || [];
    });

    this.landingSectionService.getVisibleSections().subscribe(res => {
      if (res.success) this.dynamicSections = res.data || [];
    });
    
    // Start carousel
    this.startCarousel();
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  startCarousel() {
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }, 5000);
  }

  setSlide(index: number) {
    this.currentSlide = index;
    clearInterval(this.slideInterval);
    this.startCarousel();
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('assets/')) return path;
    return 'http://localhost:8085/api/files/download/' + path;
  }
}
