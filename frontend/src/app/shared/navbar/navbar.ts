import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-charcoal sticky-top fe-navbar">
      <div class="container">
        <a class="navbar-brand fw-bold text-orange fs-4" routerLink="/">🍴 FoodExpress</a>

        <button class="navbar-toggler" type="button"
                data-bs-toggle="collapse" data-bs-target="#mainNav"
                aria-controls="mainNav" aria-expanded="false" aria-label="Menu">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/restaurants" routerLinkActive="active">Restaurants</a>
            </li>

            @if (session.role() === 'client') {
              <li class="nav-item">
                <a class="nav-link" routerLink="/my-orders" routerLinkActive="active">Mes commandes</a>
              </li>
            }
            @if (session.role() === 'restaurateur') {
              <li class="nav-item">
                <a class="nav-link" routerLink="/restaurant/dashboard" routerLinkActive="active">Dashboard</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/restaurant/dishes" routerLinkActive="active">Plats</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/restaurant/orders" routerLinkActive="active">Commandes</a>
              </li>
            }
            @if (session.role() === 'admin') {
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin/categories" routerLinkActive="active">Catégories</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin/restaurants" routerLinkActive="active">Restaurants</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin/users" routerLinkActive="active">Utilisateurs</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/admin/stats" routerLinkActive="active">Statistiques</a>
              </li>
            }
          </ul>

          <ul class="navbar-nav align-items-lg-center gap-lg-2">
            @if (session.role() === 'client' || !session.isLoggedIn()) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/cart">
                  Panier
                  <span class="badge rounded-pill bg-primary">{{ cart.count() }}</span>
                </a>
              </li>
            }

            @if (session.isLoggedIn()) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/profile">
                  {{ session.user()?.prenom }}
                </a>
              </li>
              <li class="nav-item">
                <button class="btn btn-outline-light btn-sm" (click)="session.logout()">
                  Déconnexion
                </button>
              </li>
            } @else {
              <li class="nav-item">
                <a class="nav-link" routerLink="/login">Connexion</a>
              </li>
              <li class="nav-item">
                <a class="btn btn-primary btn-sm" routerLink="/register">Inscription</a>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `,
})
export class Navbar {
  session = inject(SessionService);
  cart = inject(CartService);
}
