import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { RestaurantService } from '../../core/services/restaurant.service';
import { DishService } from '../../core/services/dish.service';
import { CartService } from '../../core/services/cart.service';
import { ReviewService, ReviewsResponse } from '../../core/services/review.service';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';
import { Category, Dish, Restaurant } from '../../core/mock-data';
import { Stars } from '../../shared/stars';

@Component({
  selector: 'app-restaurant-details',
  imports: [RouterLink, DatePipe, FormsModule, Stars],
  template: `
    @if (restaurant(); as r) {
      <div class="container my-4">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h2 class="mb-1">{{ r.nom }}</h2>
            <div class="d-flex align-items-center gap-2 mb-1">
              @if (reviews().total) {
                <app-stars [value]="reviews().moyenne" />
                <small class="text-muted">{{ reviews().moyenne }} / 5 · {{ reviews().total }} avis</small>
              } @else {
                <small class="text-muted">Pas encore d'avis</small>
              }
            </div>
            <p class="text-muted mb-1">{{ r.description }}</p>
            <p class="small mb-0">{{ r.typeCuisine }} · {{ r.horaires }} · Livraison {{ r.fraisLivraison }} DT
              <span class="badge ms-2" [class.bg-success]="r.isOpen" [class.bg-secondary]="!r.isOpen">
                {{ r.isOpen ? 'Ouvert' : 'Fermé' }}</span></p>
            <p class="small mb-0 mt-1">📍 {{ r.adresse }}
              · <a [href]="mapsLink(r)" target="_blank" rel="noopener">Itinéraire</a>
              @if (hasCoords(r)) {
                · <button type="button" class="btn btn-link p-0 align-baseline small" (click)="showMap.set(!showMap())">{{ showMap() ? 'Masquer la carte' : 'Voir sur la carte' }}</button>
              }
            </p>
          </div>
          <a routerLink="/cart" class="btn btn-dark">🛒 Panier ({{ cart.count() }})</a>
        </div>

        @if (showMap() && mapUrl()) {
          <div class="ratio ratio-21x9 mb-3 rounded-4 overflow-hidden shadow-sm">
            <iframe [src]="mapUrl()!" title="Carte" loading="lazy"></iframe>
          </div>
        }

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

        <!-- ===== Avis clients ===== -->
        <h4 class="mt-5 mb-3">Avis des clients</h4>

        @if (session.role() === 'client') {
          <div class="card mb-3">
            <div class="card-body">
              <h6 class="mb-2">{{ myReview() ? 'Modifier mon avis' : 'Laisser un avis' }}</h6>
              <app-stars [value]="note()" [interactive]="true" size="2rem" (rate)="note.set($event)" />
              <textarea class="form-control mt-2" rows="2" maxlength="500"
                        placeholder="Votre commentaire (facultatif)"
                        [ngModel]="commentaire()" (ngModelChange)="commentaire.set($event)"></textarea>
              <button class="btn btn-sm text-white mt-2" style="background:#FF6B35"
                      [disabled]="!note() || sending()" (click)="sendReview()">
                {{ sending() ? 'Envoi...' : 'Publier' }}
              </button>
              <div class="small text-muted mt-1">Réservé aux clients ayant reçu une commande de ce restaurant.</div>
            </div>
          </div>
        } @else if (!session.isLoggedIn()) {
          <p class="small text-muted"><a routerLink="/login">Connectez-vous</a> pour laisser un avis.</p>
        }

        @for (v of reviews().reviews; track v._id) {
          <div class="card mb-2">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                  <strong>{{ v.auteur }}</strong>
                  <app-stars [value]="v.note" size="0.95rem" />
                </div>
                <small class="text-muted">{{ v.createdAt | date: 'dd/MM/yyyy' }}</small>
              </div>
              @if (v.commentaire) { <p class="mb-0 mt-1">{{ v.commentaire }}</p> }
            </div>
          </div>
        } @empty {
          <p class="text-muted">Soyez le premier à donner votre avis.</p>
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
  private reviewApi = inject(ReviewService);
  private toast = inject(ToastService);
  cart = inject(CartService);
  session = inject(SessionService);

  restaurant = signal<Restaurant | null>(null);
  dishes = signal<Dish[]>([]);
  categories = signal<Category[]>([]);
  reviews = signal<ReviewsResponse>({ reviews: [], moyenne: 0, total: 0 });
  error = signal('');
  showMap = signal(false);
  private sanitizer = inject(DomSanitizer);

  hasCoords(r: Restaurant) {
    return r.latitude != null && r.longitude != null;
  }

  // lien Google Maps : par coordonnées si on les a, sinon par adresse
  mapsLink(r: Restaurant) {
    const q = this.hasCoords(r) ? `${r.latitude},${r.longitude}` : encodeURIComponent(r.adresse);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  // carte OpenStreetMap intégrée (l'URL n'est construite qu'avec des nombres, donc sûre)
  mapUrl = computed<SafeResourceUrl | null>(() => {
    const r = this.restaurant();
    if (!r || !this.hasCoords(r)) return null;
    const lat = Number(r.latitude), lng = Number(r.longitude);
    const d = 0.006;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // formulaire d'avis
  note = signal(0);
  commentaire = signal('');
  sending = signal(false);

  // l'avis déjà laissé par le client connecté (s'il existe)
  myReview = computed(() => {
    const me = this.session.user()?._id;
    return me ? this.reviews().reviews.find((v) => v.client === me) ?? null : null;
  });

  groups = computed(() =>
    this.categories()
      .map((cat) => ({ cat, dishes: this.dishes().filter((d) => d.categorie === cat._id) }))
      .filter((g) => g.dishes.length > 0),
  );

  private restaurantId = this.route.snapshot.paramMap.get('id')!;

  constructor() {
    const id = this.restaurantId;
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
    this.loadReviews();
  }

  private loadReviews() {
    this.reviewApi.list(this.restaurantId).subscribe({
      next: (res) => {
        this.reviews.set(res);
        const mine = this.myReview();
        if (mine) {                       // pré-remplit le formulaire avec l'avis existant
          this.note.set(mine.note);
          this.commentaire.set(mine.commentaire);
        }
      },
      error: () => {},                    // les avis sont un bonus : on n'empêche pas d'afficher le menu
    });
  }

  sendReview() {
    this.sending.set(true);
    this.reviewApi.send(this.restaurantId, this.note(), this.commentaire()).subscribe({
      next: () => {
        this.sending.set(false);
        this.toast.success('Merci pour votre avis !');
        this.loadReviews();
      },
      error: (e) => {
        this.sending.set(false);
        this.toast.error(e.error?.message ?? "Impossible d'envoyer l'avis");
      },
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
