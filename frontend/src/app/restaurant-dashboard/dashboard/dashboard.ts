import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderService, RestaurantOrder, RestaurantStats } from '../../core/services/order.service';
import { Loading } from '../../shared/loading';
import { ErrorMessage } from '../../shared/error-message';

@Component({
  imports: [DatePipe, RouterLink, Loading, ErrorMessage],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private api = inject(OrderService);

  stats = signal<RestaurantStats | null>(null);
  orders = signal<RestaurantOrder[]>([]);
  loading = signal(true);
  error = signal('');

  // Orders waiting for an answer, newest first (the API already sorts by date), max 5
  newOrders = computed(() => this.orders().filter((o) => o.statut === 'en_attente').slice(0, 5));

  constructor() {
    forkJoin({ stats: this.api.restaurantStats(), orders: this.api.restaurantOrders() }).subscribe({
      next: ({ stats, orders }) => {
        this.stats.set(stats);
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.error?.message ?? 'Erreur de chargement');
      },
    });
  }
}
