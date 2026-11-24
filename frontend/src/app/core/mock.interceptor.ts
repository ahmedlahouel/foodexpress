// src/app/core/mock/mock.interceptor.ts
// Fakes the backend so the front-end can work before the real API is ready.
// Services keep calling http://localhost:5000/api/... : to switch to the real
// API, simply remove this interceptor from app.config.ts (or set useMock = false).

import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError, timer } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import {
  MOCK_CATEGORIES, MOCK_DISHES, MOCK_ORDERS, MOCK_PASSWORD,
  MOCK_RESTAURANTS, MOCK_USERS, Order, Statut, User,
} from './mock-data';

export const useMock = true;

// In-memory state (reset on page reload)
const users: User[] = structuredClone(MOCK_USERS);
const orders: Order[] = structuredClone(MOCK_ORDERS);
const passwords: Record<string, string> = {};

const ok = (body: unknown, status = 200) =>
  of(new HttpResponse({ status, body })).pipe(delay(300));

const fail = (status: number, message: string) =>
  timer(300).pipe(
    mergeMap(() => throwError(() => new HttpErrorResponse({ status, error: { message } }))),
  );

const tokenFor = (id: string) => `mock-token-${id}`;

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!useMock || !req.url.includes('/api/')) return next(req);

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, '');
  const q = url.searchParams;
  const body: any = req.body ?? {};
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const me = users.find((u) => tokenFor(u._id) === auth);

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
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
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
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(body.newPassword)) return fail(400, 'Mot de passe faible');
    passwords[me._id] = body.newPassword;
    return ok({ message: 'Mot de passe modifié' });
  }

  // ---------- RESTAURANTS ----------
  if (req.method === 'GET' && path === '/restaurants') {
    let list = [...MOCK_RESTAURANTS];
    const search = q.get('search')?.toLowerCase();
    const cuisine = q.get('cuisine');
    if (search) list = list.filter((r) => r.nom.toLowerCase().includes(search));
    if (cuisine) list = list.filter((r) => r.typeCuisine === cuisine);
    if (q.get('open') === 'true') list = list.filter((r) => r.isOpen);
    if (q.get('sort') === 'nom') list.sort((a, b) => a.nom.localeCompare(b.nom));
    return ok(list);
  }
  const resto = path.match(/^\/restaurants\/([^/]+)$/);
  if (req.method === 'GET' && resto) {
    const r = MOCK_RESTAURANTS.find((x) => x._id === resto[1]);
    return r ? ok(r) : fail(404, 'Restaurant introuvable');
  }

  // ---------- DISHES & CATEGORIES ----------
  if (req.method === 'GET' && path === '/dishes') {
    let list = [...MOCK_DISHES];
    const r = q.get('restaurant');
    const c = q.get('category');
    if (r) list = list.filter((d) => d.restaurant === r);
    if (c) list = list.filter((d) => d.categorie === c);
    return ok(list);
  }
  if (req.method === 'GET' && path === '/categories') {
    const r = q.get('restaurant');
    return ok(r ? MOCK_CATEGORIES.filter((c) => c.restaurant === r) : MOCK_CATEGORIES);
  }

  // ---------- ORDERS ----------
  if (req.method === 'POST' && path === '/orders') {
    if (!me) return fail(401, 'Non authentifie');
    const resto = MOCK_RESTAURANTS.find((r) => r._id === body.restaurant);
    if (!resto) return fail(400, 'Restaurant invalide');
    if (!body.articles?.length) return fail(400, 'Commande vide');
    const articles = [];
    for (const a of body.articles) {
      const d = MOCK_DISHES.find((x) => x._id === a.plat);
      if (!d) return fail(400, 'Plat introuvable');
      if (!d.disponible) return fail(400, `${d.nom} n'est pas disponible`);
      if (!(a.quantite >= 1)) return fail(400, 'Quantite invalide');
      articles.push({ plat: d._id, nom: d.nom, quantite: a.quantite, prixUnitaire: d.prix });
    }
    const sousTotal = articles.reduce((s, a) => s + a.quantite * a.prixUnitaire, 0);
    const order: Order = {
      _id: 'o' + (orders.length + 1), client: me._id, restaurant: resto._id, articles,
      adresseLivraison: body.adresseLivraison, sousTotal, fraisLivraison: resto.fraisLivraison,
      total: sousTotal + resto.fraisLivraison, modePaiement: body.modePaiement,
      statut: 'en_attente', remarque: body.remarque,
    };
    orders.push(order);
    return ok(order, 201);
  }
  if (req.method === 'GET' && path === '/orders/my-orders') {
    if (!me) return fail(401, 'Non authentifie');
    return ok(orders.filter((o) => o.client === me._id).reverse());
  }
  const status = path.match(/^\/orders\/([^/]+)\/status$/);
  if (req.method === 'PUT' && status) {
    const o = orders.find((x) => x._id === status[1]);
    if (!o) return fail(404, 'Commande introuvable');
    const next = body.statut as Statut;
    const flow: Record<Statut, Statut[]> = {
      en_attente: ['acceptee', 'annulee'], acceptee: ['en_preparation', 'annulee'],
      en_preparation: ['en_livraison'], en_livraison: ['livree'], livree: [], annulee: [],
    };
    if (!flow[o.statut].includes(next)) return fail(400, 'Transition de statut invalide');
    o.statut = next;
    return ok(o);
  }

  return next(req); // anything not mocked goes to the real API
};
