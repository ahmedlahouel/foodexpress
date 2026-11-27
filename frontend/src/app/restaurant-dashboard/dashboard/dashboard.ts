import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ChartConfiguration } from 'chart.js';
import { OrderService, RestaurantOrder, RestaurantStats } from '../../core/services/order.service';
import { Loading } from '../../shared/loading';
import { ErrorMessage } from '../../shared/error-message';
import { ChartCanvas } from '../../shared/chart-canvas';

@Component({
  imports: [DatePipe, RouterLink, Loading, ErrorMessage, ChartCanvas],
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

  // Barres : plats les plus commandés
  dishesChart = computed<ChartConfiguration>(() => {
    const top = this.stats()?.platsPopulaires ?? [];
    return {
      type: 'bar',
      data: {
        labels: top.map((p) => p.nom),
        datasets: [{ label: 'Quantité commandée', data: top.map((p) => p.quantiteTotale), backgroundColor: '#FF6B35' }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    };
  });

  // Doughnut : commandes par statut (calculé côté front à partir de la liste des commandes)
  statusChart = computed<ChartConfiguration>(() => {
    const defs = [
      ['en_attente', 'En attente', '#ffc107'],
      ['acceptee', 'Acceptée', '#0dcaf0'],
      ['en_preparation', 'En préparation', '#FF6B35'],
      ['en_livraison', 'En livraison', '#6c757d'],
      ['livree', 'Livrée', '#198754'],
      ['annulee', 'Annulée', '#dc3545'],
    ] as const;
    const rows = defs
      .map(([k, label, color]) => ({ label, color, n: this.orders().filter((o) => o.statut === k).length }))
      .filter((r) => r.n > 0);
    return {
      type: 'doughnut',
      data: {
        labels: rows.map((r) => r.label),
        datasets: [{ data: rows.map((r) => r.n), backgroundColor: rows.map((r) => r.color) }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    };
  });

  // Courbe : chiffre d'affaires par jour (commandes non annulées / non en attente)
  revenueChart = computed<ChartConfiguration>(() => {
    const perDay = new Map<string, number>();
    for (const o of this.orders()) {
      if (o.statut === 'annulee' || o.statut === 'en_attente' || !o.createdAt) continue;
      const day = o.createdAt.slice(0, 10);
      perDay.set(day, (perDay.get(day) ?? 0) + o.total);
    }
    const days = [...perDay.keys()].sort();
    return {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: "Chiffre d'affaires (DT)",
          data: days.map((d) => perDay.get(d)!),
          borderColor: '#FF6B35',
          backgroundColor: 'rgba(255,107,53,.15)',
          fill: true,
          tension: 0.3,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
    };
  });

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
