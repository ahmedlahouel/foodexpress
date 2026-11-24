import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api-url';
import { User } from '../mock-data';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  me() {
    return this.http.get<User>(`${API_URL}/users/me`);
  }

  update(body: { nom?: string; prenom?: string; telephone?: string }) {
    return this.http.put<User>(`${API_URL}/users/me`, body);
  }

  changePassword(body: { currentPassword: string; newPassword: string; confirmation: string }) {
    return this.http.put<{ message: string }>(`${API_URL}/users/me/password`, body);
  }
}
