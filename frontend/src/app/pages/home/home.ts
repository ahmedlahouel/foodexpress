import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Restaurant } from '../../core/mock-data';
import { RestaurantCard } from '../restaurants/restaurant-card';
import { cuisineGradient, cuisineStyle } from '../../shared/cuisine';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, RestaurantCard],
  template: `
    <!-- ===== Hero ===== -->
    <section class="fe-hero text-white text-center">
      <span class="fe-float fe-f1">🍕</span><span class="fe-float fe-f2">🍔</span>
      <span class="fe-float fe-f3">🍣</span><span class="fe-float fe-f4">🥙</span>
      <span class="fe-float fe-f5">🍰</span><span class="fe-float fe-f6">🍝</span>
      <div class="container position-relative">
        <span class="badge rounded-pill text-bg-light mb-3 px-3 py-2">🛵 Livraison rapide à Bizerte</span>
        <h1 class="display-4 fw-bold">Vos plats préférés,<br />livrés <span class="fe-underline">chez vous</span></h1>
        <p class="lead mb-4">Pizza, sushi, grillades, burgers… commandez auprès des meilleurs restaurants de la ville.</p>
        <div class="input-group input-group-lg mx-auto fe-search" style="max-width:560px">
          <input class="form-control border-0" placeholder="🔍 Rechercher un restaurant..."
                 [ngModel]="search()" (ngModelChange)="search.set($event)" (keyup.enter)="onSearch()" />
          <button class="btn btn-dark px-4" (click)="onSearch()">Rechercher</button>
        </div>
        <a class="btn btn-light rounded-pill mt-3 px-4" routerLink="/restaurants" [queryParams]="{ near: 1 }">
          📍 Trouver les restaurants près de moi
        </a>
      </div>
    </section>

    <div class="container my-5">
      <!-- ===== Cuisines ===== -->
      <h3 class="fe-title mb-3">Que voulez-vous manger ?</h3>
      <div class="row g-3 mb-5">
        @for (c of cuisines(); track c) {
          <div class="col-6 col-sm-4 col-md-3 col-lg-2">
            <a class="fe-cuisine-tile" routerLink="/restaurants" [queryParams]="{ cuisine: c }"
               [style.background]="gradient(c)">
              <span class="fe-cuisine-emoji">{{ emoji(c) }}</span>
              <span class="fw-semibold">{{ c }}</span>
            </a>
          </div>
        }
      </div>

      <!-- ===== Populaires ===== -->
      <div class="d-flex justify-content-between align-items-end mb-3">
        <h3 class="fe-title mb-0">🔥 Restaurants populaires</h3>
        <a routerLink="/restaurants" class="fw-semibold text-decoration-none">Tout voir →</a>
      </div>
      <div class="row g-3">
        @for (r of popular(); track r._id) {
          <div class="col-12 col-sm-6 col-lg-4"><app-restaurant-card [restaurant]="r" /></div>
        }
      </div>

      <!-- ===== Comment ça marche ===== -->
      <h3 class="fe-title mt-5 mb-3">Comment ça marche ?</h3>
      <div class="row g-3 text-center">
        <div class="col-md-4"><div class="fe-step"><div class="fe-step-icon">🔎</div>
          <h6>1. Choisissez</h6><p class="small text-muted mb-0">Parcourez les restaurants et leurs menus.</p></div></div>
        <div class="col-md-4"><div class="fe-step"><div class="fe-step-icon">🛒</div>
          <h6>2. Commandez</h6><p class="small text-muted mb-0">Ajoutez vos plats au panier et indiquez votre adresse.</p></div></div>
        <div class="col-md-4"><div class="fe-step"><div class="fe-step-icon">🛵</div>
          <h6>3. Savourez</h6><p class="small text-muted mb-0">Suivez votre commande jusqu'à la livraison.</p></div></div>
      </div>
    </div>
  `,
})
export class Home {
  private api = inject(RestaurantService);
  private router = inject(Router);

  search = signal('');
  restaurants = signal<Restaurant[]>([]);
  cuisines = computed(() => [...new Set(this.restaurants().map((r) => r.typeCuisine))]);
  popular = computed(() => [...this.restaurants()].filter((r) => r.isOpen).sort((a, b) => (b.noteMoyenne ?? 0) - (a.noteMoyenne ?? 0)).slice(0, 3));

  constructor() {
    this.api.getAll().subscribe((r) => this.restaurants.set(r));
  }

  gradient = cuisineGradient;
  emoji = (c: string) => cuisineStyle(c).emoji;

  onSearch() {
    this.router.navigate(['/restaurants'], { queryParams: { search: this.search() || null } });
  }
}
