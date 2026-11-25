import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_URL } from './api-url';
import { SessionService, Role, SessionUser } from './session.service';

export interface AuthResponse {
  token: string;
  user: SessionUser;
}

export interface RegisterPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  confirmation: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private session = inject(SessionService);

  login(body: { email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, body)
      .pipe(tap((res) => this.save(res)));
  }

  register(body: RegisterPayload) {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, body)
      .pipe(tap((res) => this.save(res)));
  }

  /** Page shown right after login, depending on the role. */
  homeFor(role: Role): string {
    if (role === 'admin') return '/admin/users';
    if (role === 'restaurateur') return '/restaurant/dashboard';
    return '/';
  }

  // Same keys as SessionService (navbar reads them)
  private save(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.session.refresh();
  }
}
