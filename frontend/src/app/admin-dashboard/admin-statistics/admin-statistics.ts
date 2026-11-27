import { Component, computed, inject, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { AdminService, AdminStats } from '../../core/services/admin.service';
import { Loading } from '../../shared/loading';
import { ErrorMessage } from '../../shared/error-message';
import { ChartCanvas } from '../../shared/chart-canvas';

const STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
};
const STATUS_COLORS = ['#ffc107', '#0dcaf0', '#FF6B35', '#6c757d', '#198754', '#dc3545'];

@Component({
  imports: [Loading, ErrorMessage, ChartCanvas],
  selector: 'app-admin-statistics',
  styleUrl: './admin-statistics.css',
  templateUrl: './admin-statistics.html',
})
export class AdminStatistics {
  private api = inject(AdminService);

  stats = signal<AdminStats | null>(null);
  loading = signal(true);
  error = signal('');

  // Doughnut : commandes par statut
  statusChart = computed<ChartConfiguration | null>(() => {
    const byStatus = this.stats()?.ordersByStatus;
    if (!byStatus) return null;
    const keys = Object.keys(STATUS_LABELS).filter((k) => byStatus[k]);
    return {
      type: 'doughnut',
      data: {
        labels: keys.map((k) => STATUS_LABELS[k]),
        datasets: [{ data: keys.map((k) => byStatus[k]), backgroundColor: keys.map((k) => STATUS_COLORS[Object.keys(STATUS_LABELS).indexOf(k)]) }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    };
  });

  // Courbe : chiffre d'affaires par jour
  revenueChart = computed<ChartConfiguration | null>(() => {
    const days = this.stats()?.revenueByDay;
    if (!days) return null;
    return {
      type: 'line',
      data: {
        labels: days.map((d) => d.date),
        datasets: [{
          label: "Chiffre d'affaires (DT)",
          data: days.map((d) => d.total),
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
    this.api.stats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.error?.message ?? 'Erreur de chargement');
      },
    });
  }
}
