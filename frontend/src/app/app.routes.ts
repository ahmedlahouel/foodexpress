import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'restaurants', loadComponent: () => import('./pages/restaurants/restaurants').then((m) => m.Restaurants) },
  { path: 'restaurants/:id', loadComponent: () => import('./pages/restaurant-details/restaurant-details').then((m) => m.RestaurantDetails) },
  { path: 'cart', loadComponent: () => import('./pages/cart/cart').then((m) => m.Cart) },
  { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout) },
  { path: 'my-orders', canActivate: [authGuard], loadComponent: () => import('./pages/my-orders/my-orders').then((m) => m.MyOrders) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile) },

    { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
    { path: 'register', loadComponent: () => import('./pages/register/register').then((m) => m.Register) },
    { path: 'admin/users', canActivate: [roleGuard], data: { roles: ['admin'] }, loadComponent: () => import('./admin-dashboard/admin-users/admin-users').then((m) => m.AdminUsers) },
    { path: 'admin/stats', canActivate: [roleGuard], data: { roles: ['admin'] }, loadComponent: () => import('./admin-dashboard/admin-statistics/admin-statistics').then((m) => m.AdminStatistics) },
    { path: 'admin/categories', canActivate: [roleGuard], data: { roles: ['admin'] }, loadComponent: () => import('./admin-dashboard/admin-categories/admin-categories').then((m) => m.AdminCategories) },
    { path: 'restaurant/dashboard', canActivate: [roleGuard], data: { roles: ['restaurateur'] }, loadComponent: () => import('./restaurant-dashboard/dashboard/dashboard').then((m) => m.Dashboard) },
    { path: 'restaurant/dishes', canActivate: [roleGuard], data: { roles: ['restaurateur'] }, loadComponent: () => import('./restaurant-dashboard/manage-dishes/manage-dishes').then((m) => m.ManageDishes) },
    { path: 'restaurant/orders', canActivate: [roleGuard], data: { roles: ['restaurateur'] }, loadComponent: () => import('./restaurant-dashboard/manage-orders/manage-orders').then((m) => m.ManageOrders) },
  { path: '**', redirectTo: '' },
];
