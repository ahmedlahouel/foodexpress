import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Restaurant } from '../../core/mock-data';

@Component({
  selector: 'app-restaurant-card',
  imports: [RouterLink],
  template: `
    <div class="card h-100 shadow-sm">
      <div class="position-relative d-flex align-items-center justify-content-center"
           style="height:140px;background:#ffe9e0;font-size:3rem">
        🍽️
        <img [src]="'images/' + restaurant().image" [alt]="restaurant().nom"
             class="position-absolute w-100 h-100 object-fit-cover"
             (error)="$any($event.target).style.display = 'none'" />
      </div>
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <h5 class="card-title mb-1">{{ restaurant().nom }}</h5>
          <span class="badge" [class.bg-success]="restaurant().isOpen" [class.bg-secondary]="!restaurant().isOpen">
            {{ restaurant().isOpen ? 'Ouvert' : 'Fermé' }}
          </span>
        </div>
        <p class="text-muted small mb-2">{{ restaurant().typeCuisine }} · {{ restaurant().horaires }}</p>
        <p class="small mb-3">Livraison : {{ restaurant().fraisLivraison }} DT</p>
        <a class="btn btn-sm text-white" style="background:#FF6B35"
           [routerLink]="['/restaurants', restaurant()._id]">Voir le menu</a>
      </div>
    </div>
  `,
})
export class RestaurantCard {
  restaurant = input.required<Restaurant>();
}
