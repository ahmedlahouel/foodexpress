import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, RestaurantOrder } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { Statut } from '../../core/mock-data';
import { Loading } from '../../shared/loading';
import { ErrorMessage } from '../../shared/error-message';

const LABELS: Record<Statut, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const BADGES: Record<Statut, string> = {
  en_attente: 'bg-warning text-dark',
  acceptee: 'bg-info text-dark',
  en_preparation: 'bg-primary',
  en_livraison: 'bg-secondary',
  livree: 'bg-success',
  annulee: 'bg-danger',
};

// Same lifecycle as the backend: only these next statuses are offered
const NEXT: Record<Statut, Statut[]> = {
  en_attente: ['acceptee', 'annulee'],
  acceptee: ['en_preparation', 'annulee'],
  en_preparation: ['en_livraison'],
  en_livraison: ['livree'],
  livree: [],
  annulee: [],
};

const ACTION_LABELS: Record<Statut, string> = {
  en_attente: '',
  acceptee: 'Accepter',
  en_preparation: 'Passer en préparation',
  en_livraison: 'Mettre en livraison',
  livree: 'Marquer livrée',
  annulee: 'Annuler',
};

@Component({
  imports: [DatePipe, FormsModule, Loading, ErrorMessage],
  selector: 'app-manage-orders',
  styleUrl: './manage-orders.css',
  templateUrl: './manage-orders.html',
})
export class ManageOrders {
  private api = inject(OrderService);
  private toast = inject(ToastService);

  readonly statuts = Object.keys(LABELS) as Statut[];
  readonly next = NEXT;

  orders = signal<RestaurantOrder[]>([]);
  filter = signal('');
  loading = signal(true);
  error = signal('');

  filtered = computed(() =>
    this.filter() ? this.orders().filter((o) => o.statut === this.filter()) : this.orders(),
  );

  constructor() {
    this.load();
  }

  load() {
    this.api.restaurantOrders().subscribe({
      next: (list) => {
        this.orders.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.error?.message ?? 'Erreur de chargement');
      },
    });
  }

  label(s: Statut) {
    return LABELS[s];
  }

  badge(s: Statut) {
    return 'badge ' + BADGES[s];
  }

  actionLabel(from: Statut, to: Statut) {
    if (to === 'annulee') return from === 'en_attente' ? 'Refuser' : 'Annuler';
    return ACTION_LABELS[to];
  }

  changeStatus(o: RestaurantOrder, to: Statut) {
    if (to === 'annulee' && !confirm('Annuler cette commande ?')) return;
    this.api.updateStatus(o._id, to).subscribe({
      next: () => {
        this.toast.success('Statut mis à jour');
        this.load();
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Erreur'),
    });
  }
}
