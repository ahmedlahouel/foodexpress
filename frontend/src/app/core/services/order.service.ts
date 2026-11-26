import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api-url';
import { Order, Statut } from '../mock-data';

export interface CreateOrderPayload {
  restaurant: string;
  articles: { plat: string; quantite: number }[];
  adresseLivraison: string;
  modePaiement: string;
  remarque?: string;
}

// The restaurant endpoints return the client and restaurant populated
export interface RestaurantOrder extends Omit<Order, 'client' | 'restaurant'> {
  client: { _id: string; nom: string; prenom: string; email: string; telephone: string };
  restaurant: { _id: string; nom: string };
  createdAt: string;
}

export interface RestaurantStats {
  totalCommandes: number;
  enAttente: number;
  acceptees: number;
  chiffreAffaires: number;
  platsPopulaires: { _id: string; nom: string; quantiteTotale: number }[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  create(payload: CreateOrderPayload) {
    return this.http.post<Order>(`${API_URL}/orders`, payload);
  }

  myOrders() {
    return this.http.get<Order[]>(`${API_URL}/orders/my-orders`);
  }

  restaurantOrders() {
    return this.http.get<RestaurantOrder[]>(`${API_URL}/orders/restaurant`);
  }

  updateStatus(id: string, statut: Statut) {
    return this.http.put<Order>(`${API_URL}/orders/${id}/status`, { statut });
  }

  restaurantStats() {
    return this.http.get<RestaurantStats>(`${API_URL}/orders/restaurant/stats`);
  }
}
