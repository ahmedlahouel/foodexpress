import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api-url';
import { Order } from '../mock-data';

export interface CreateOrderPayload {
  restaurant: string;
  articles: { plat: string; quantite: number }[];
  adresseLivraison: string;
  modePaiement: string;
  remarque?: string;
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
}
