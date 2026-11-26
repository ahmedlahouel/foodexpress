import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api-url';
import { Restaurant } from '../mock-data';

export interface RestaurantFilters {
  search?: string;
  cuisine?: string;
  open?: boolean;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private http = inject(HttpClient);

  getAll(f: RestaurantFilters = {}) {
    const q = new URLSearchParams();
    if (f.search) q.set('search', f.search);
    if (f.cuisine) q.set('cuisine', f.cuisine);
    if (f.open) q.set('open', 'true');
    if (f.sort) q.set('sort', f.sort);
    const qs = q.toString();
    return this.http.get<Restaurant[]>(`${API_URL}/restaurants${qs ? '?' + qs : ''}`);
  }

  getById(id: string) {
    return this.http.get<Restaurant>(`${API_URL}/restaurants/${id}`);
  }

  // Restaurants owned by the logged-in restaurateur
  getMine() {
    return this.http.get<Restaurant[]>(`${API_URL}/restaurants/mine`);
  }
}
