import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap, timer } from 'rxjs';
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
const ICONS: Record<Statut, string> = {
  en_attente: '🕒',
  acceptee: '📋',
  en_preparation: '👨‍🍳',
  en_livraison: '🛵',
  livree: '✅',
  annulee: '❌',
};
const FLOW: Statut[] = ['en_attente', 'acceptee', 'en_preparation', 'en_livraison', 'livree'];

@Component({
  selector: 'app-my-orders',
  imports: [RouterLink],
  styles: [`
    .tracker { display: flex; align-items: flex-start; margin-top: .75rem; }
    .step { flex: 1; text-align: center; position: relative; }
    .step::before {            /* ligne entre deux étapes */
      content: ''; position: absolute; top: 18px; left: -50%; width: 100%;
      height: 4px; background: #dee2e6; z-index: 0;
    }
    .step:first-child::before { display: none; }
    .step.done::before { background: var(--fe-orange); }
    .dot {
      width: 40px; height: 40px; border-radius: 50%; margin: 0 auto;
      display: flex; align-items: center; justify-content: center;
      background: #fff; border: 3px solid #dee2e6; position: relative; z-index: 1;
      filter: grayscale(1); opacity: .6; transition: all .3s;
    }
    .step.done .dot { border-color: var(--fe-orange); filter: none; opacity: 1; }
    .step.current .dot { animation: pulse 1.5s infinite; background: #ffe9e0; }
    .lbl { font-size: .72rem; margin-top: .35rem; color: #6c757d; }
    .step.done .lbl { color: var(--fe-charcoal); font-weight: 600; }
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 rgba(255, 107, 53, .5); }
      70%  { box-shadow: 0 0 0 10px rgba(255, 107, 53, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
    }
  `],
  template: `
    <div class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="mb-0">Mes commandes</h2>
        <span class="small text-muted">🔄 Mise à jour automatique toutes les 10 s</span>
      </div>

      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      @if (loaded() && orders().length === 0) {
        <div class="alert alert-info">Aucune commande. <a routerLink="/restaurants">Commander maintenant</a></div>
      }

      @for (o of orders(); track o._id) {
        <div class="card mb-3 shadow-sm">
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

            @if (o.statut === 'annulee') {
              <div class="alert alert-danger py-2 mb-0">{{ icon('annulee') }} Cette commande a été annulée.</div>
            } @else {
              <div class="tracker">
                @for (s of flow; track s; let i = $index) {
                  <div class="step" [class.done]="i <= step(o)" [class.current]="i === step(o) && o.statut !== 'livree'">
                    <div class="dot">{{ icon(s) }}</div>
                    <div class="lbl">{{ label(s) }}</div>
                  </div>
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
    // timer(0, 10000) : une première requête tout de suite, puis une toutes les 10 secondes.
    // takeUntilDestroyed arrête le polling quand on quitte la page.
    timer(0, 10_000)
      .pipe(
        switchMap(() =>
          forkJoin({ orders: this.orderApi.myOrders(), restos: this.restaurantApi.getAll() }).pipe(
            catchError((e) => {
              this.error.set(e.error?.message ?? 'Erreur de chargement');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        if (!res) return;
        this.error.set('');
        this.names.set(Object.fromEntries(res.restos.map((r) => [r._id, r.nom])));
        this.orders.set(res.orders);
        this.loaded.set(true);
      });
  }

  label = (s: Statut) => LABELS[s];
  color = (s: Statut) => COLORS[s];
  icon = (s: Statut) => ICONS[s];
  step = (o: Order) => FLOW.indexOf(o.statut);
  restoName = (id: string) => this.names()[id] ?? 'Restaurant';
}
