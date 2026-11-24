import { Injectable, computed, effect, signal } from '@angular/core';
import { Dish, Restaurant } from '../mock-data';

export interface CartItem {
  plat: string;
  nom: string;
  prix: number;
  quantite: number;
}
export interface CartRestaurant {
  _id: string;
  nom: string;
  fraisLivraison: number;
}

const KEY = 'foodexpress_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  restaurant = signal<CartRestaurant | null>(null);
  items = signal<CartItem[]>([]);

  count = computed(() => this.items().reduce((s, i) => s + i.quantite, 0));
  subtotal = computed(() => this.items().reduce((s, i) => s + i.prix * i.quantite, 0));
  fraisLivraison = computed(() => (this.items().length ? this.restaurant()?.fraisLivraison ?? 0 : 0));
  total = computed(() => this.subtotal() + this.fraisLivraison());

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (saved) {
        this.restaurant.set(saved.restaurant);
        this.items.set(saved.items ?? []);
      }
    } catch {}
    // sauvegarde à chaque changement : le panier survit à la navigation
    effect(() => {
      const data = { restaurant: this.restaurant(), items: this.items() };
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
    });
  }

  /** false si le panier contient déjà des plats d'un autre restaurant */
  canAdd(restaurantId: string): boolean {
    return this.items().length === 0 || this.restaurant()?._id === restaurantId;
  }

  add(dish: Dish, resto: Restaurant) {
    if (!this.canAdd(resto._id)) this.clear();
    this.restaurant.set({ _id: resto._id, nom: resto.nom, fraisLivraison: resto.fraisLivraison });
    const existing = this.items().find((i) => i.plat === dish._id);
    if (existing) this.increase(dish._id);
    else this.items.update((l) => [...l, { plat: dish._id, nom: dish.nom, prix: dish.prix, quantite: 1 }]);
  }

  increase(id: string) {
    this.items.update((l) => l.map((i) => (i.plat === id ? { ...i, quantite: i.quantite + 1 } : i)));
  }

  decrease(id: string) {
    this.items.update((l) =>
      l.map((i) => (i.plat === id ? { ...i, quantite: i.quantite - 1 } : i)).filter((i) => i.quantite > 0),
    );
  }

  remove(id: string) {
    this.items.update((l) => l.filter((i) => i.plat !== id));
  }

  clear() {
    this.items.set([]);
    this.restaurant.set(null);
  }
}
