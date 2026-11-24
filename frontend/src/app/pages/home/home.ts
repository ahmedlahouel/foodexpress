import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Restaurant } from '../../core/mock-data';
import { RestaurantCard } from '../restaurants/restaurant-card';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, RestaurantCard],
  template: `
    <section class="text-white text-center py-5" style="background:linear-gradient(135deg,#FF6B35,#c0392b)">
      <div class="container">
        <h1 class="display-5 fw-bold">Vos plats préférés, livrés chez vous</h1>
        <p class="lead">Commandez auprès des meilleurs restaurants de la ville.</p>
        <div class="input-group mx-auto" style="max-width:520px">
          <input class="form-control" placeholder="Rechercher un restaurant..."
                 [ngModel]="search()" (ngModelChange)="search.set($event)" (keyup.enter)="onSearch()" />
          <button class="btn btn-dark" (click)="onSearch()">Rechercher</button>
        </div>
      </div>
    </section>

    <div class="container my-4">
      <h4 class="mb-3">Catégories de cuisine</h4>
      <div class="d-flex flex-wrap gap-2 mb-4">
        @for (c of cuisines(); track c) {
          <a class="btn btn-outline-dark rounded-pill" routerLink="/restaurants"
             [queryParams]="{ cuisine: c }">{{ c }}</a>
        }
      </div>

      <h4 class="mb-3">Restaurants populaires</h4>
      <div class="row g-3">
        @for (r of popular(); track r._id) {
          <div class="col-12 col-sm-6 col-lg-4"><app-restaurant-card [restaurant]="r" /></div>
        }
      </div>
      <div class="text-center mt-4">
        <a routerLink="/restaurants" class="btn btn-outline-dark">Voir tous les restaurants</a>
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
  popular = computed(() => this.restaurants().filter((r) => r.isOpen).slice(0, 3));

  constructor() {
    this.api.getAll().subscribe((r) => this.restaurants.set(r));
  }

  onSearch() {
    this.router.navigate(['/restaurants'], { queryParams: { search: this.search() || null } });
  }
}
