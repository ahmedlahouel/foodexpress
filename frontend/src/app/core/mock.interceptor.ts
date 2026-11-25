// src/app/core/mock.interceptor.ts
// Fakes the backend so the front-end can work before the real API is ready.
// Services keep calling http://localhost:5000/api/... : to switch to the real
// API, simply remove this interceptor from app.config.ts (or set useMock = false).

import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError, timer } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import {
  Category, Dish, MOCK_CATEGORIES, MOCK_DISHES, MOCK_ORDERS, MOCK_PASSWORD,
  MOCK_RESTAURANTS, MOCK_USERS, Order, Restaurant, Statut, User,
} from './mock-data';

export const useMock = true;

// TEMPORARY: a request without token is treated as coming from this user.
// 'u1' = client, 'u2' = restaurateur, 'u3' = admin. Set to null once the real login works.
const DEV_USER_ID: string | null = 'u2';

// In-memory state (reset on page reload)
const users: User[] = structuredClone(MOCK_USERS);
const orders: Order[] = structuredClone(MOCK_ORDERS);
const restaurants: Restaurant[] = structuredClone(MOCK_RESTAURANTS);
const dishes: Dish[] = structuredClone(MOCK_DISHES);
const categories: Category[] = structuredClone(MOCK_CATEGORIES);
const passwords: Record<string, string> = {};

const ok = (body: unknown, status = 200) =>
  of(new HttpResponse({ status, body })).pipe(delay(300));

const fail = (status: number, message: string) =>
  timer(300).pipe(
    mergeMap(() => throwError(() => new HttpErrorResponse({ status, error: { message } }))),
  );

const tokenFor = (id: string) => `mock-token-${id}`;
const newId = (prefix: string) => prefix + Date.now().toString(36) + Math.floor(Math.random() * 100);
const isValidated = (r: Restaurant) => (r.validation ?? 'validee') === 'validee';

const STRONG_PWD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const FLOW: Record<Statut, Statut[]> = {
  en_attente: ['acceptee', 'annulee'],
  acceptee: ['en_preparation', 'annulee'],
  en_preparation: ['en_livraison'],
  en_livraison: ['livree'],
  livree: [],
  annulee: [],
};

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!useMock || !req.url.includes('/api/')) return next(req);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, '');
  const q = url.searchParams;
  const body: any = req.body ?? {};
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const me =
    users.find((u) => tokenFor(u._id) === auth) ??
    (DEV_USER_ID ? users.find((u) => u._id === DEV_USER_ID) : undefined);

  const ownerOf = (restaurantId: string) => restaurants.find((r) => r._id === restaurantId)?.owner;
  const isAdmin = me?.role === 'admin';
  const canManage = (restaurantId: string) => !!me && (isAdmin || ownerOf(restaurantId) === me._id);

  // ---------- AUTH ----------
  if (req.method === 'POST' && path === '/auth/login') {
    const u = users.find((x) => x.email === body.email);
    const pwd = u ? passwords[u._id] ?? MOCK_PASSWORD : '';
    if (!u || body.password !== pwd) return fail(401, 'Email ou mot de passe incorrect');
    if (!u.isActive) return fail(403, 'Compte desactive');
    return ok({ token: tokenFor(u._id), user: u });
  }

  if (req.method === 'POST' && path === '/auth/register') {
    const { nom, prenom, email, telephone, password, confirmation } = body;
    if (!nom || !prenom || !email || !telephone || !password) return fail(400, 'Champ manquant');
    if (password !== confirmation) return fail(400, 'Les mots de passe ne correspondent pas');
    if (!STRONG_PWD.test(password)) {
      return fail(400, 'Mot de passe faible (8 caracteres, une lettre, un chiffre)');
    }
    if (users.some((u) => u.email === email)) return fail(409, 'Email deja utilise');
    const u: User = { _id: 'u' + (users.length + 1), nom, prenom, email, telephone, role: 'client', isActive: true };
    users.push(u);
    passwords[u._id] = password;
    return ok({ token: tokenFor(u._id), user: u }, 201);
  }

  // ---------- PROFILE ----------
  if (path === '/users/me' && req.method === 'GET') {
    return me ? ok(me) : fail(401, 'Non authentifie');
  }
  if (path === '/users/me' && req.method === 'PUT') {
    if (!me) return fail(401, 'Non authentifie');
    const { nom, prenom, telephone } = body;
    if (nom !== undefined) me.nom = nom;
    if (prenom !== undefined) me.prenom = prenom;
    if (telephone !== undefined) me.telephone = telephone;
    return ok(me);
  }
  if (path === '/users/me/password' && req.method === 'PUT') {
    if (!me) return fail(401, 'Non authentifie');
    const current = passwords[me._id] ?? MOCK_PASSWORD;
    if (body.currentPassword !== current) return fail(400, 'Mot de passe actuel incorrect');
    if (body.newPassword !== body.confirmation) return fail(400, 'Les mots de passe ne correspondent pas');
    if (!STRONG_PWD.test(body.newPassword)) return fail(400, 'Mot de passe faible');
    passwords[me._id] = body.newPassword;
    return ok({ message: 'Mot de passe modifié' });
  }

  // ---------- RESTAURANTS ----------
  if (req.method === 'GET' && path === '/restaurants') {
    // public sees validated restaurants only; admin sees everything
    let list = restaurants.filter((r) => isAdmin || isValidated(r));
    const search = q.get('search')?.toLowerCase();
    const cuisine = q.get('cuisine');
    if (search) list = list.filter((r) => r.nom.toLowerCase().includes(search));
    if (cuisine) list = list.filter((r) => r.typeCuisine === cuisine);
    if (q.get('open') === 'true') list = list.filter((r) => r.isOpen);
    if (q.get('sort') === 'nom') list = [...list].sort((a, b) => a.nom.localeCompare(b.nom));
    return ok(list);
  }

  if (req.method === 'POST' && path === '/restaurants') {
    if (!me) return fail(401, 'Non authentifie');
    if (!isAdmin) return fail(403, 'Acces refuse');
    if (!body.nom || !body.owner) return fail(400, 'Nom et proprietaire obligatoires');
    if (body.fraisLivraison !== undefined && !(Number(body.fraisLivraison) >= 0)) {
      return fail(400, 'Frais de livraison invalides');
    }
    const r: Restaurant = {
      _id: newId('r'), nom: body.nom, description: body.description ?? '', adresse: body.adresse ?? '',
      typeCuisine: body.typeCuisine ?? '', image: body.image ?? '', fraisLivraison: Number(body.fraisLivraison ?? 0),
      horaires: body.horaires ?? '', isOpen: body.isOpen ?? true, owner: body.owner, validation: 'validee',
    };
    restaurants.push(r);
    return ok(r, 201);
  }

  const validation = path.match(/^\/restaurants\/([^/]+)\/validation$/);
  if (req.method === 'PUT' && validation) {
    if (!me) return fail(401, 'Non authentifie');
    if (!isAdmin) return fail(403, 'Acces refuse');
    const r = restaurants.find((x) => x._id === validation[1]);
    if (!r) return fail(404, 'Restaurant introuvable');
    // body shape to agree with Bassem: { "validation": "validee" | "suspendue" }
    if (!['validee', 'suspendue', 'en_attente'].includes(body.validation)) return fail(400, 'Validation invalide');
    r.validation = body.validation;
    return ok(r);
  }

  const resto = path.match(/^\/restaurants\/([^/]+)$/);
  if (resto) {
    const r = restaurants.find((x) => x._id === resto[1]);
    if (req.method === 'GET') return r ? ok(r) : fail(404, 'Restaurant introuvable');
    if (!me) return fail(401, 'Non authentifie');
    if (!r) return fail(404, 'Restaurant introuvable');
    if (req.method === 'PUT') {
      if (!canManage(r._id)) return fail(403, 'Acces refuse');
      if (body.fraisLivraison !== undefined && !(Number(body.fraisLivraison) >= 0)) {
        return fail(400, 'Frais de livraison invalides');
      }
      for (const k of ['nom', 'description', 'adresse', 'typeCuisine', 'image', 'horaires', 'isOpen'] as const) {
        if (body[k] !== undefined) (r as any)[k] = body[k];
      }
      if (body.fraisLivraison !== undefined) r.fraisLivraison = Number(body.fraisLivraison);
      if (isAdmin && body.owner) r.owner = body.owner;
      return ok(r);
    }
    if (req.method === 'DELETE') {
      if (!isAdmin) return fail(403, 'Acces refuse');
      restaurants.splice(restaurants.indexOf(r), 1);
      return ok({ message: 'Restaurant supprime' });
    }
  }

  // ---------- DISHES ----------
  if (req.method === 'GET' && path === '/dishes') {
    let list = [...dishes];
    const r = q.get('restaurant');
    const c = q.get('category');
    if (r) list = list.filter((d) => d.restaurant === r);
    if (c) list = list.filter((d) => d.categorie === c);
    return ok(list);
  }

  if (req.method === 'POST' && path === '/dishes') {
    if (!me) return fail(401, 'Non authentifie');
    if (!body.nom || !body.restaurant || !body.categorie) return fail(400, 'Champ manquant');
    if (!(Number(body.prix) >= 0) || body.prix === '' || body.prix === null) return fail(400, 'Prix invalide');
    if (!canManage(body.restaurant)) return fail(403, 'Acces refuse');
    const d: Dish = {
      _id: newId('d'), nom: body.nom, description: body.description ?? '', prix: Number(body.prix),
      image: body.image ?? '', disponible: body.disponible ?? true,
      categorie: body.categorie, restaurant: body.restaurant,
    };
    dishes.push(d);
    return ok(d, 201);
  }

  const dish = path.match(/^\/dishes\/([^/]+)$/);
  if (dish && (req.method === 'PUT' || req.method === 'DELETE')) {
    if (!me) return fail(401, 'Non authentifie');
    const d = dishes.find((x) => x._id === dish[1]);
    if (!d) return fail(404, 'Plat introuvable');
    if (!canManage(d.restaurant)) return fail(403, 'Acces refuse');
    if (req.method === 'DELETE') {
      dishes.splice(dishes.indexOf(d), 1);
      return ok({ message: 'Plat supprime' });
    }
    if (body.prix !== undefined && !(Number(body.prix) >= 0)) return fail(400, 'Prix invalide');
    for (const k of ['nom', 'description', 'image', 'disponible', 'categorie'] as const) {
      if (body[k] !== undefined) (d as any)[k] = body[k];
    }
    if (body.prix !== undefined) d.prix = Number(body.prix);
    return ok(d);
  }

  // ---------- CATEGORIES ----------
  if (req.method === 'GET' && path === '/categories') {
    const r = q.get('restaurant');
    return ok(r ? categories.filter((c) => c.restaurant === r) : categories);
  }

  if (req.method === 'POST' && path === '/categories') {
    if (!me) return fail(401, 'Non authentifie');
    if (!body.nom || !body.restaurant) return fail(400, 'Champ manquant');
    if (!canManage(body.restaurant)) return fail(403, 'Acces refuse');
    const c: Category = { _id: newId('c'), nom: body.nom, description: body.description ?? '', restaurant: body.restaurant };
    categories.push(c);
    return ok(c, 201);
  }

  const cat = path.match(/^\/categories\/([^/]+)$/);
  if (cat && (req.method === 'PUT' || req.method === 'DELETE')) {
    if (!me) return fail(401, 'Non authentifie');
    const c = categories.find((x) => x._id === cat[1]);
    if (!c) return fail(404, 'Categorie introuvable');
    if (!canManage(c.restaurant)) return fail(403, 'Acces refuse');
    if (req.method === 'DELETE') {
      categories.splice(categories.indexOf(c), 1);
      return ok({ message: 'Categorie supprimee' });
    }
    if (body.nom !== undefined) c.nom = body.nom;
    if (body.description !== undefined) c.description = body.description;
    return ok(c);
  }

  // ---------- ORDERS ----------
  if (req.method === 'POST' && path === '/orders') {
    if (!me) return fail(401, 'Non authentifie');
    const r = restaurants.find((x) => x._id === body.restaurant);
    if (!r) return fail(400, 'Restaurant invalide');
    if (!body.articles?.length) return fail(400, 'Commande vide');
    const articles = [];
    for (const a of body.articles) {
      const d = dishes.find((x) => x._id === a.plat);
      if (!d) return fail(400, 'Plat introuvable');
      if (!d.disponible) return fail(400, `${d.nom} n'est pas disponible`);
      if (!(a.quantite >= 1)) return fail(400, 'Quantite invalide');
      articles.push({ plat: d._id, nom: d.nom, quantite: a.quantite, prixUnitaire: d.prix });
    }
    const sousTotal = articles.reduce((s, a) => s + a.quantite * a.prixUnitaire, 0);
    const order: Order = {
      _id: 'o' + (orders.length + 1), client: me._id, restaurant: r._id, articles,
      adresseLivraison: body.adresseLivraison, sousTotal, fraisLivraison: r.fraisLivraison,
      total: sousTotal + r.fraisLivraison, modePaiement: body.modePaiement,
      statut: 'en_attente', remarque: body.remarque,
    };
    orders.push(order);
    return ok(order, 201);
  }

  if (req.method === 'GET' && path === '/orders/my-orders') {
    if (!me) return fail(401, 'Non authentifie');
    return ok(orders.filter((o) => o.client === me._id).reverse());
  }

  // restaurateur: orders of his own restaurants
  if (req.method === 'GET' && path === '/orders/restaurant') {
    if (!me) return fail(401, 'Non authentifie');
    if (me.role !== 'restaurateur') return fail(403, 'Acces refuse');
    const mine = restaurants.filter((r) => r.owner === me._id).map((r) => r._id);
    return ok(orders.filter((o) => mine.includes(o.restaurant)).reverse());
  }

  // Response shape (to agree with Bassem):
  // { totalOrders, pending, accepted, revenue, topDishes: [{ plat, nom, quantite }] }
  if (req.method === 'GET' && path === '/orders/restaurant/stats') {
    if (!me) return fail(401, 'Non authentifie');
    if (me.role !== 'restaurateur') return fail(403, 'Acces refuse');
    const mine = restaurants.filter((r) => r.owner === me._id).map((r) => r._id);
    const list = orders.filter((o) => mine.includes(o.restaurant));
    const counts = new Map<string, { plat: string; nom: string; quantite: number }>();
    for (const o of list.filter((x) => x.statut !== 'annulee')) {
      for (const a of o.articles) {
        const cur = counts.get(a.plat) ?? { plat: a.plat, nom: a.nom, quantite: 0 };
        cur.quantite += a.quantite;
        counts.set(a.plat, cur);
      }
    }
    return ok({
      totalOrders: list.length,
      pending: list.filter((o) => o.statut === 'en_attente').length,
      accepted: list.filter((o) => o.statut === 'acceptee').length,
      revenue: list.filter((o) => o.statut !== 'annulee').reduce((s, o) => s + o.total, 0),
      topDishes: [...counts.values()].sort((a, b) => b.quantite - a.quantite).slice(0, 5),
    });
  }

  const status = path.match(/^\/orders\/([^/]+)\/status$/);
  if (req.method === 'PUT' && status) {
    if (!me) return fail(401, 'Non authentifie');
    if (me.role !== 'restaurateur') return fail(403, 'Acces refuse');
    const o = orders.find((x) => x._id === status[1]);
    if (!o) return fail(404, 'Commande introuvable');
    if (ownerOf(o.restaurant) !== me._id) return fail(403, 'Acces refuse');
    if (o.statut === 'livree') return fail(400, 'Commande livree : modification impossible');
    const nextStatus = body.statut as Statut;
    if (!FLOW[o.statut].includes(nextStatus)) return fail(400, 'Transition de statut invalide');
    o.statut = nextStatus;
    return ok(o);
  }

  return next(req); // anything not mocked goes to the real API
};
