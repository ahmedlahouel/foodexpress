import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUser } from '../../core/services/admin.service';
import { Role, SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';
import { Loading } from '../../shared/loading';
import { ErrorMessage } from '../../shared/error-message';

@Component({
  imports: [FormsModule, Loading, ErrorMessage],
  selector: 'app-admin-users',
  styleUrl: './admin-users.css',
  templateUrl: './admin-users.html',
})
export class AdminUsers {
  private api = inject(AdminService);
  private toast = inject(ToastService);
  private session = inject(SessionService);

  readonly roles: Role[] = ['client', 'restaurateur', 'admin'];

  users = signal<AdminUser[]>([]);
  search = signal('');
  roleFilter = signal('');
  page = signal(1);
  totalPages = signal(1);
  total = signal(0);
  loading = signal(false);
  error = signal('');

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.api
      .users({ search: this.search().trim(), role: this.roleFilter(), page: this.page(), limit: 10 })
      .subscribe({
        next: (res) => {
          this.users.set(res.users);
          this.total.set(res.total);
          this.totalPages.set(Math.max(res.totalPages, 1));
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.error.set(e.error?.message ?? 'Erreur de chargement');
        },
      });
  }

  applyFilters() {
    this.page.set(1);
    this.load();
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.load();
  }

  // The admin cannot change his own account (the backend refuses it too)
  isMe(u: AdminUser) {
    return u._id === this.session.user()?._id;
  }

  toggleStatus(u: AdminUser) {
    const activate = !u.isActive;
    this.api.setStatus(u._id, activate).subscribe({
      next: () => {
        this.toast.success(activate ? 'Compte activé' : 'Compte désactivé');
        this.load();
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Erreur'),
    });
  }

  changeRole(u: AdminUser, role: string) {
    if (role === u.role) return;
    this.api.setRole(u._id, role as Role).subscribe({
      next: () => {
        this.toast.success('Rôle modifié');
        this.load();
      },
      error: (e) => {
        this.toast.error(e.error?.message ?? 'Erreur');
        this.load();
      },
    });
  }
}
