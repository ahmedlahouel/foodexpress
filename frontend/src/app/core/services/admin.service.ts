import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api-url';
import { Role } from './session.service';

export interface AdminUser {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: Role;
  isActive: boolean;
}

export interface AdminUsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminStats {
  clients: number;
  restaurants: number;
  orders: number;
  revenue: number;
  // bonus (optionnels : le front fonctionne même si le back ne les renvoie pas)
  ordersByStatus?: Record<string, number>;
  revenueByDay?: { date: string; total: number }[];
}

export interface AdminUserFilters {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  users(f: AdminUserFilters = {}) {
    const q = new URLSearchParams();
    if (f.search) q.set('search', f.search);
    if (f.role) q.set('role', f.role);
    if (f.page) q.set('page', String(f.page));
    if (f.limit) q.set('limit', String(f.limit));
    const qs = q.toString();
    return this.http.get<AdminUsersPage>(`${API_URL}/admin/users${qs ? '?' + qs : ''}`);
  }

  setStatus(id: string, isActive: boolean) {
    return this.http.put<AdminUser>(`${API_URL}/admin/users/${id}/status`, { isActive });
  }

  setRole(id: string, role: Role) {
    return this.http.put<AdminUser>(`${API_URL}/admin/users/${id}/role`, { role });
  }

  stats() {
    return this.http.get<AdminStats>(`${API_URL}/admin/stats`);
  }
}
