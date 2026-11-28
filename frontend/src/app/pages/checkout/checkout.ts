import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { LocationService } from '../../core/services/location.service';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container my-4" style="max-width:720px">
      <h2 class="mb-3">Validation de la commande</h2>

      @if (cart.items().length === 0) {
        <div class="alert alert-info">Votre panier est vide. <a routerLink="/restaurants">Choisir un restaurant</a></div>
      } @else {
        <div class="mb-3">
          <label class="form-label">Adresse de livraison *</label>
          <div class="input-group">
            <input class="form-control" placeholder="Rue, ville..." [ngModel]="adresse()" (ngModelChange)="adresse.set($event)" />
            <button class="btn btn-outline-primary" type="button" [disabled]="locating()" (click)="useMyLocation()">
              📍 {{ locating() ? 'Localisation...' : 'Ma position' }}
            </button>
          </div>
          @if (loc.error()) { <div class="small text-danger mt-1">{{ loc.error() }}</div> }
          <div class="form-text">Vous pouvez corriger l'adresse trouvée (ajoutez le numéro, l'étage, un repère...).</div>
        </div>
        <div class="mb-3">
          <label class="form-label">Remarque (optionnel)</label>
          <textarea class="form-control" rows="2" [ngModel]="remarque()" (ngModelChange)="remarque.set($event)"></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Mode de paiement</label>
          <select class="form-select" disabled>
            <option>Paiement à la livraison</option>
          </select>
        </div>

        <div class="card mb-3">
          <div class="card-body">
            <h6>Récapitulatif — {{ cart.restaurant()?.nom }}</h6>
            @for (i of cart.items(); track i.plat) {
              <div class="d-flex justify-content-between small">
                <span>{{ i.quantite }} × {{ i.nom }}</span><span>{{ i.prix * i.quantite }} DT</span>
              </div>
            }
            <hr />
            <div class="d-flex justify-content-between"><span>Sous-total</span><span>{{ cart.subtotal() }} DT</span></div>
            <div class="d-flex justify-content-between"><span>Livraison</span><span>{{ cart.fraisLivraison() }} DT</span></div>
            <div class="d-flex justify-content-between fw-bold"><span>Total (indicatif)</span><span>{{ cart.total() }} DT</span></div>
            <p class="small text-muted mb-0 mt-2">Le total final est recalculé par le serveur.</p>
          </div>
        </div>

        @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
        <button class="btn text-white" style="background:#FF6B35" [disabled]="loading()" (click)="confirm()">
          {{ loading() ? 'Envoi...' : 'Confirmer la commande' }}
        </button>
      }
    </div>
  `,
})
export class Checkout {
  cart = inject(CartService);
  private orders = inject(OrderService);
  private router = inject(Router);
  loc = inject(LocationService);
  locating = signal(false);

  adresse = signal('');
  remarque = signal('');
  error = signal('');
  loading = signal(false);

  async useMyLocation() {
    this.locating.set(true);
    const pos = await this.loc.locate();
    if (pos) this.adresse.set(await this.loc.addressFrom(pos));
    this.locating.set(false);
  }

  confirm() {
    this.error.set('');
    if (!this.adresse().trim()) {
      this.error.set("L'adresse de livraison est obligatoire");
      return;
    }
    this.loading.set(true);
    this.orders
      .create({
        restaurant: this.cart.restaurant()!._id,
        articles: this.cart.items().map((i) => ({ plat: i.plat, quantite: i.quantite })),
        adresseLivraison: this.adresse().trim(),
        modePaiement: 'livraison',
        remarque: this.remarque().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.cart.clear();
          this.router.navigate(['/my-orders']);
        },
        error: (e) => {
          this.loading.set(false);
          this.error.set(e.error?.message ?? 'Erreur lors de la commande');
        },
      });
  }
}
