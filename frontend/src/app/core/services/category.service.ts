import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api-url';

export interface CategoryItem {
  _id: string;
  nom: string;
  description: string;
  restaurant: string | null; // null = global category created by the admin
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<CategoryItem[]>(`${API_URL}/categories`);
  }

  create(body: { nom: string; description?: string }) {
    return this.http.post<CategoryItem>(`${API_URL}/categories`, body);
  }

  update(id: string, body: { nom?: string; description?: string }) {
    return this.http.put<CategoryItem>(`${API_URL}/categories/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<{ message: string }>(`${API_URL}/categories/${id}`);
  }
}
