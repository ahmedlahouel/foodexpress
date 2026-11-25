import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export type Role = 'client' | 'restaurateur' | 'admin';

export interface SessionUser {
  _id: string;
  nom: string;
  prenom: string;
  role: Role;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private router = inject(Router);

  readonly user = signal<SessionUser | null>(this.read());
  readonly role = computed(() => this.user()?.role ?? null);
  readonly isLoggedIn = computed(() => !!this.user());

  private read(): SessionUser | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  }

  /** À rappeler après un login (ou écouter le service d'Ahmed). */
  refresh() {
    this.user.set(this.read());
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.user.set(null);
    this.router.navigate(['/login']);
  }
}
