import { Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Restaurant } from '../../core/mock-data';
import { LocationService } from '../../core/services/location.service';
import { Stars } from '../../shared/stars';
import { cuisineGradient, cuisineStyle } from '../../shared/cuisine';

@Component({
  selector: 'app-restaurant-card',
  imports: [RouterLink, Stars, DecimalPipe],
  template: `
    <div class="card h-100 shadow-sm fe-resto-card" [class.fe-closed]="!restaurant().isOpen">
      <div class="fe-resto-cover" [style.background]="gradient()">
        <span class="fe-resto-emoji">{{ style().emoji }}</span>
        <img [src]="'images/' + restaurant().image" [alt]="restaurant().nom"
             class="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
             (error)="$any($event.target).style.display = 'none'" />
        <span class="badge fe-pill-badge position-absolute top-0 start-0 m-2"
              [class.bg-success]="restaurant().isOpen" [class.bg-secondary]="!restaurant().isOpen">
          {{ restaurant().isOpen ? 'Ouvert' : 'Fermé' }}
        </span>
        @if (distance() !== null) {
          <span class="badge fe-pill-badge bg-dark position-absolute top-0 end-0 m-2">
            📍 {{ distance()! < 1 ? (distance()! * 1000 | number: '1.0-0') + ' m' : (distance()! | number: '1.1-1') + ' km' }}
          </span>
        }
      </div>
      <div class="card-body">
        <h5 class="card-title mb-1">{{ restaurant().nom }}</h5>
        <div class="mb-2 d-flex align-items-center gap-2">
          @if (restaurant().nbAvis) {
            <app-stars [value]="restaurant().noteMoyenne ?? 0" size="1rem" />
            <small class="text-muted">{{ restaurant().noteMoyenne }} ({{ restaurant().nbAvis }})</small>
          } @else {
            <small class="text-muted">Pas encore d'avis</small>
          }
        </div>
        <p class="small mb-2">
          <span class="fe-chip">{{ style().emoji }} {{ restaurant().typeCuisine }}</span>
          <span class="text-muted ms-1">🕒 {{ restaurant().horaires }}</span>
        </p>
        <p class="small text-muted mb-3">🛵 Livraison : {{ restaurant().fraisLivraison }} DT</p>
        <a class="btn btn-primary btn-sm rounded-pill px-3" [routerLink]="['/restaurants', restaurant()._id]">Voir le menu</a>
      </div>
    </div>
  `,
})
export class RestaurantCard {
  private loc = inject(LocationService);
  restaurant = input.required<Restaurant>();

  style = computed(() => cuisineStyle(this.restaurant().typeCuisine));
  gradient = computed(() => cuisineGradient(this.restaurant().typeCuisine));

  // distance en km entre l'utilisateur et le restaurant (null si on ne connaît pas l'un des deux)
  distance = computed(() => {
    const me = this.loc.position();
    const r = this.restaurant();
    if (!me || r.latitude == null || r.longitude == null) return null;
    return this.loc.distanceKm(me, { lat: r.latitude, lng: r.longitude });
  });
}
