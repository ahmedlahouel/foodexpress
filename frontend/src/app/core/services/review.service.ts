import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api-url';

export interface Review {
  _id: string;
  note: number;
  commentaire: string;
  createdAt: string;
  client: string | null;
  auteur: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  moyenne: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  list(restaurantId: string) {
    return this.http.get<ReviewsResponse>(`${API_URL}/restaurants/${restaurantId}/reviews`);
  }

  // Crée l'avis, ou le modifie si le client en a déjà laissé un
  send(restaurantId: string, note: number, commentaire: string) {
    return this.http.post<Review>(`${API_URL}/restaurants/${restaurantId}/reviews`, { note, commentaire });
  }
}
