import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api-url';
import { Category, Dish } from '../mock-data';

export interface DishPayload {
  nom: string;
  description?: string;
  prix: number;
  image?: string;
  disponible?: boolean;
  categorie?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DishService {
  private http = inject(HttpClient);

  getByRestaurant(restaurantId: string) {
    return this.http.get<Dish[]>(`${API_URL}/dishes?restaurant=${restaurantId}`);
  }

  getCategories(restaurantId: string) {
    return this.http.get<Category[]>(`${API_URL}/categories?restaurant=${restaurantId}`);
  }

  create(body: DishPayload & { restaurant: string }) {
    return this.http.post<Dish>(`${API_URL}/dishes`, body);
  }

  update(id: string, body: Partial<DishPayload>) {
    return this.http.put<Dish>(`${API_URL}/dishes/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<{ message: string }>(`${API_URL}/dishes/${id}`);
  }
}
