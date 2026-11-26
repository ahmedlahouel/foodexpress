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

// Same names as the backend: statutValidation en_attente / valide / suspendu
export type Validation = 'en_attente' | 'valide' | 'suspendu';

// Admin list: all statuses, owner populated by the backend
export interface AdminRestaurant extends Omit<Restaurant, 'owner' | 'validation'> {
  owner: { _id: string; nom: string; prenom: string; email: string } | null;
  statutValidation: Validation;
}

export interface RestaurantPayload {
  nom: string;
  description?: string;
  adresse: string;
  typeCuisine: string;
  image?: string;
  fraisLivraison: number;
  horaires?: string;
  isOpen?: boolean;
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

  // ---------- Admin ----------
  getAllAdmin(statut: Validation | '' = '') {
    const qs = statut ? `?statutValidation=${statut}` : '';
    return this.http.get<AdminRestaurant[]>(`${API_URL}/restaurants/admin/all${qs}`);
  }

  create(body: RestaurantPayload & { owner: string }) {
    return this.http.post<Restaurant>(`${API_URL}/restaurants`, body);
  }

  update(id: string, body: Partial<RestaurantPayload>) {
    return this.http.put<Restaurant>(`${API_URL}/restaurants/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<{ message: string }>(`${API_URL}/restaurants/${id}`);
  }

  setValidation(id: string, statutValidation: Validation) {
    return this.http.put<Restaurant>(`${API_URL}/restaurants/${id}/validation`, { statutValidation });
  }
}
