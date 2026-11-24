import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Order, Statut } from '../../core/mock-data';

const LABELS: Record<Statut, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
};
const COLORS: Record<Statut, string> = {
  en_attente: 'bg-warning text-dark',
  acceptee: 'bg-info text-dark',
  en_preparation: 'bg-primary',
  en_livraison: 'bg-secondary',
  livree: 'bg-success',
  annulee: 'bg-danger',
};
const FLOW: Statut[] = ['en_attente', 'acceptee', 'en_preparation', 'en_livraison', 'livree'];

@Component({
  selector: 'app-my-orders',
  imports: [RouterLink],
  template: `
    <div class="container my-4">
      <h2 class="mb-3">Mes commandes</h2>

      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      @if (loaded() && orders().length === 0) {
        <div class="alert alert-info">Aucune commande. <a routerLink="/restaurants">Commander maintenant</a></div>
      }

      @for (o of orders(); track o._id) {
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between flex-wrap gap-2">
              <h5 class="mb-0">{{ restoName(o.restaurant) }}</h5>
              <span class="badge fs-6" [class]="color(o.statut)">{{ label(o.statut) }}</span>
            </div>
            <ul class="small mt-2 mb-2">
              @for (a of o.articles; track a.plat) {
                <li>{{ a.quantite }} × {{ a.nom }} — {{ a.prixUnitaire * a.quantite }} DT</li>
              }
            </ul>
            <p class="small text-muted mb-2">
              Livraison : {{ o.adresseLivraison }} · Total : <strong>{{ o.total }} DT</strong>
            </p>

            @if (o.statut !== 'annulee') {
              <div class="d-flex flex-wrap gap-1 align-items-center">
                @for (s of flow; track s; let i = $index) {
                  <span class="badge" [class.bg-success]="i <= step(o)" [class.bg-light]="i > step(o)"
                        [class.text-dark]="i > step(o)">{{ label(s) }}</span>
                  @if (i < flow.length - 1) { <span class="text-muted">›</span> }
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class MyOrders {
  private orderApi = inject(OrderService);
  private restaurantApi = inject(RestaurantService);

  orders = signal<Order[]>([]);
  names = signal<Record<string, string>>({});
  loaded = signal(false);
  error = signal('');
  flow = FLOW;

  constructor() {
    forkJoin({ orders: this.orderApi.myOrders(), restos: this.restaurantApi.getAll() }).subscribe({
      next: ({ orders, restos }) => {
        this.names.set(Object.fromEntries(restos.map((r) => [r._id, r.nom])));
        this.orders.set(orders);
        this.loaded.set(true);
      },
      error: (e) => this.error.set(e.error?.message ?? 'Erreur de chargement'),
    });
  }

  label = (s: Statut) => LABELS[s];
  color = (s: Statut) => COLORS[s];
  step = (o: Order) => FLOW.indexOf(o.statut);
  restoName = (id: string) => this.names()[id] ?? 'Restaurant';
}
