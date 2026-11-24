import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Restaurant } from '../../core/mock-data';
import { RestaurantCard } from './restaurant-card';

@Component({
  selector: 'app-restaurants',
  imports: [FormsModule, RestaurantCard],
  template: `
    <div class="container my-4">
      <h2 class="mb-3">Restaurants</h2>

      <div class="row g-2 mb-4 align-items-center">
        <div class="col-12 col-md-4">
          <input class="form-control" placeholder="Rechercher par nom"
                 [ngModel]="search()" (ngModelChange)="search.set($event); load()" />
        </div>
        <div class="col-6 col-md-3">
          <select class="form-select" [ngModel]="cuisine()" (ngModelChange)="cuisine.set($event); load()">
            <option value="">Toutes les cuisines</option>
            @for (c of cuisines(); track c) { <option [value]="c">{{ c }}</option> }
          </select>
        </div>
        <div class="col-6 col-md-2">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="open"
                   [ngModel]="openOnly()" (ngModelChange)="openOnly.set($event); load()" />
            <label class="form-check-label" for="open">Ouverts</label>
          </div>
        </div>
        <div class="col-12 col-md-3">
          <button class="btn btn-outline-dark w-100" (click)="toggleSort()">
            Tri A-Z : {{ sortAlpha() ? 'activé' : 'désactivé' }}
          </button>
        </div>
      </div>

      @if (paged().length === 0) {
        <p class="text-muted">Aucun restaurant trouvé.</p>
      }
      <div class="row g-3">
        @for (r of paged(); track r._id) {
          <div class="col-12 col-sm-6 col-lg-4"><app-restaurant-card [restaurant]="r" /></div>
        }
      </div>

      @if (totalPages() > 1) {
        <nav class="mt-4">
          <ul class="pagination justify-content-center">
            <li class="page-item" [class.disabled]="page() === 1">
              <button class="page-link" (click)="page.set(page() - 1)">«</button>
            </li>
            @for (p of pageNumbers(); track p) {
              <li class="page-item" [class.active]="p === page()">
                <button class="page-link" (click)="page.set(p)">{{ p }}</button>
              </li>
            }
            <li class="page-item" [class.disabled]="page() === totalPages()">
              <button class="page-link" (click)="page.set(page() + 1)">»</button>
            </li>
          </ul>
        </nav>
      }
    </div>
  `,
})
export class Restaurants {
  private api = inject(RestaurantService);
  private route = inject(ActivatedRoute);

  readonly pageSize = 6;
  search = signal(this.route.snapshot.queryParamMap.get('search') ?? '');
  cuisine = signal(this.route.snapshot.queryParamMap.get('cuisine') ?? '');
  openOnly = signal(false);
  sortAlpha = signal(false);
  page = signal(1);

  list = signal<Restaurant[]>([]);
  cuisines = signal<string[]>([]);

  totalPages = computed(() => Math.max(1, Math.ceil(this.list().length / this.pageSize)));
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  paged = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.list().slice(start, start + this.pageSize);
  });

  constructor() {
    this.api.getAll().subscribe((all) => this.cuisines.set([...new Set(all.map((r) => r.typeCuisine))]));
    this.load();
  }

  toggleSort() {
    this.sortAlpha.update((v) => !v);
    this.load();
  }

  load() {
    this.page.set(1);
    this.api
      .getAll({
        search: this.search(),
        cuisine: this.cuisine(),
        open: this.openOnly(),
        sort: this.sortAlpha() ? 'nom' : undefined,
      })
      .subscribe((r) => this.list.set(r));
  }
}
