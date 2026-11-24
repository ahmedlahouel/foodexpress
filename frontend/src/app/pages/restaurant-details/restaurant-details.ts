import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RestaurantService } from '../../core/services/restaurant.service';
import { DishService } from '../../core/services/dish.service';
import { CartService } from '../../core/services/cart.service';
import { Category, Dish, Restaurant } from '../../core/mock-data';

@Component({
  selector: 'app-restaurant-details',
  imports: [RouterLink],
  template: `
    @if (restaurant(); as r) {
      <div class="container my-4">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h2 class="mb-1">{{ r.nom }}</h2>
            <p class="text-muted mb-1">{{ r.description }}</p>
            <p class="small mb-0">{{ r.typeCuisine }} · {{ r.horaires }} · Livraison {{ r.fraisLivraison }} DT
              <span class="badge ms-2" [class.bg-success]="r.isOpen" [class.bg-secondary]="!r.isOpen">
                {{ r.isOpen ? 'Ouvert' : 'Fermé' }}</span></p>
          </div>
          <a routerLink="/cart" class="btn btn-dark">🛒 Panier ({{ cart.count() }})</a>
        </div>

        @for (g of groups(); track g.cat._id) {
          <h4 class="mt-4">{{ g.cat.nom }}</h4>
          <div class="row g-3">
            @for (d of g.dishes; track d._id) {
              <div class="col-12 col-md-6">
                <div class="card">
                  <div class="card-body d-flex justify-content-between align-items-center gap-3">
                    <div>
                      <h6 class="mb-1">{{ d.nom }}</h6>
                      <p class="small text-muted mb-1">{{ d.description }}</p>
                      <strong>{{ d.prix }} DT</strong>
                      @if (!d.disponible) { <span class="badge bg-danger ms-2">Indisponible</span> }
                    </div>
                    <button class="btn btn-sm text-white" style="background:#FF6B35"
                            [disabled]="!d.disponible" (click)="addToCart(d)">Ajouter</button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    } @else if (error()) {
      <div class="container my-4 alert alert-danger">{{ error() }}</div>
    }
  `,
})
export class RestaurantDetails {
  private route = inject(ActivatedRoute);
  private restaurantApi = inject(RestaurantService);
  private dishApi = inject(DishService);
  cart = inject(CartService);

  restaurant = signal<Restaurant | null>(null);
  dishes = signal<Dish[]>([]);
  categories = signal<Category[]>([]);
  error = signal('');

  groups = computed(() =>
    this.categories()
      .map((cat) => ({ cat, dishes: this.dishes().filter((d) => d.categorie === cat._id) }))
      .filter((g) => g.dishes.length > 0),
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      restaurant: this.restaurantApi.getById(id),
      dishes: this.dishApi.getByRestaurant(id),
      categories: this.dishApi.getCategories(id),
    }).subscribe({
      next: (res) => {
        this.restaurant.set(res.restaurant);
        this.dishes.set(res.dishes);
        this.categories.set(res.categories);
      },
      error: (e) => this.error.set(e.error?.message ?? 'Erreur de chargement'),
    });
  }

  addToCart(dish: Dish) {
    const r = this.restaurant()!;
    if (!this.cart.canAdd(r._id)) {
      const ok = confirm("Votre panier contient des plats d'un autre restaurant. Le vider et continuer ?");
      if (!ok) return;
    }
    this.cart.add(dish, r);
  }
}
