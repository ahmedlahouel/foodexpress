import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api-url';
import { Category, Dish } from '../mock-data';

@Injectable({ providedIn: 'root' })
export class DishService {
  private http = inject(HttpClient);

  getByRestaurant(restaurantId: string) {
    return this.http.get<Dish[]>(`${API_URL}/dishes?restaurant=${restaurantId}`);
  }

  getCategories(restaurantId: string) {
    return this.http.get<Category[]>(`${API_URL}/categories?restaurant=${restaurantId}`);
  }
}
