import { Component, inject, signal } from '@angular/core';
import { AdminService, AdminStats } from '../../core/services/admin.service';
import { Loading } from '../../shared/loading';
import { ErrorMessage } from '../../shared/error-message';

@Component({
  imports: [Loading, ErrorMessage],
  selector: 'app-admin-statistics',
  styleUrl: './admin-statistics.css',
  templateUrl: './admin-statistics.html',
})
export class AdminStatistics {
  private api = inject(AdminService);

  stats = signal<AdminStats | null>(null);
  loading = signal(true);
  error = signal('');

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
