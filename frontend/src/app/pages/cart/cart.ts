import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [RouterLink],
  template: `
    <div class="container my-4">
      <h2 class="mb-3">Mon panier</h2>

      @if (cart.items().length === 0) {
        <div class="alert alert-info">
          Votre panier est vide. <a routerLink="/restaurants">Parcourir les restaurants</a>
        </div>
      } @else {
        <p class="text-muted">Restaurant : <strong>{{ cart.restaurant()?.nom }}</strong></p>
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr><th>Plat</th><th>Prix</th><th class="text-center">Quantité</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              @for (i of cart.items(); track i.plat) {
                <tr>
                  <td>{{ i.nom }}</td>
                  <td>{{ i.prix }} DT</td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-dark" (click)="cart.decrease(i.plat)">−</button>
                      <span class="btn btn-light disabled">{{ i.quantite }}</span>
                      <button class="btn btn-outline-dark" (click)="cart.increase(i.plat)">+</button>
                    </div>
                  </td>
                  <td>{{ i.prix * i.quantite }} DT</td>
                  <td><button class="btn btn-sm btn-outline-danger" (click)="cart.remove(i.plat)">Supprimer</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="card ms-auto" style="max-width:360px">
          <div class="card-body">
            <div class="d-flex justify-content-between"><span>Sous-total</span><span>{{ cart.subtotal() }} DT</span></div>
            <div class="d-flex justify-content-between"><span>Frais de livraison</span><span>{{ cart.fraisLivraison() }} DT</span></div>
            <hr />
            <div class="d-flex justify-content-between fw-bold"><span>Total</span><span>{{ cart.total() }} DT</span></div>
            <a routerLink="/checkout" class="btn text-white w-100 mt-3" style="background:#FF6B35">Passer la commande</a>
            <button class="btn btn-link text-danger w-100" (click)="cart.clear()">Vider le panier</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class Cart {
  cart = inject(CartService);
}
