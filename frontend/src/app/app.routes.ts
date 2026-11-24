import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'restaurants', loadComponent: () => import('./pages/restaurants/restaurants').then((m) => m.Restaurants) },
  { path: 'restaurants/:id', loadComponent: () => import('./pages/restaurant-details/restaurant-details').then((m) => m.RestaurantDetails) },
  { path: 'cart', loadComponent: () => import('./pages/cart/cart').then((m) => m.Cart) },
  { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout) },
  { path: 'my-orders', canActivate: [authGuard], loadComponent: () => import('./pages/my-orders/my-orders').then((m) => m.MyOrders) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile) },

  // TODO (Ahmed) : garder/ajouter ici les routes login, register et admin
  { path: '**', redirectTo: '' },
];
