# API contract

Base URL: `http://localhost:5000/api`. Auth header: `Authorization: Bearer <token>`.
Money is a number in DT. Ids are MongoDB `_id` strings.

Order statuses: `en_attente`, `acceptee`, `en_preparation`, `en_livraison`, `livree`, `annulee`
Roles: `client`, `restaurateur`, `admin`

## Routes
| Method | Endpoint | Access | Back-end |
|--------|----------|--------|----------|
| POST | /auth/register | Public | Ahmed |
| POST | /auth/login | Public | Ahmed |
| GET, PUT | /users/me | Logged in | Ahmed |
| PUT | /users/me/password | Logged in | Ahmed |
| GET | /admin/users?search= | Admin | Ahmed |
| PUT | /admin/users/:id/status | Admin | Ahmed |
| PUT | /admin/users/:id/role | Admin | Ahmed |
| GET | /admin/stats | Admin | Ahmed |
| GET | /restaurants?search=&cuisine=&open=true&sort=nom | Public | Bassem |
| GET | /restaurants/:id | Public | Bassem |
| POST, PUT, DELETE | /restaurants, /restaurants/:id | Admin (owner for PUT) | Bassem |
| PUT | /restaurants/:id/validation | Admin | Bassem |
| GET | /dishes?restaurant=&category= | Public | Bassem |
| POST, PUT, DELETE | /dishes, /dishes/:id | Restaurateur (own) | Bassem |
| GET, POST, PUT, DELETE | /categories | Read public, write admin/owner | Bassem |
| POST | /orders | Client | Bassem |
| GET | /orders/my-orders | Client | Bassem |
| GET | /orders/restaurant | Restaurateur | Bassem |
| PUT | /orders/:id/status | Restaurateur (own) | Bassem |
| GET | /orders/restaurant/stats | Restaurateur | Bassem |

## JSON shapes
### Register (request)
```json
{ "nom": "Ali", "prenom": "Ahmed", "email": "ahmed@gmail.com", "telephone": "22123456",
  "password": "Secret123", "confirmation": "Secret123" }
```
Password rule: at least 8 characters, one letter and one digit. The role is always `client`.
Errors: 400 (missing field, mismatch, weak password), 409 (email already used).

### Login (request)
```json
{ "email": "ahmed@gmail.com", "password": "Secret123" }
```
Errors: 401 (wrong credentials), 403 (account deactivated).

### Login and register response

User: { "_id": "u1", "nom": "Ali", "prenom": "Ahmed", "email": "ahmed@gmail.com", "telephone": "22123456", "role": "client", "isActive": true }

Restaurant:
{ "_id": "r1", "nom": "Pizza House", "description": "Restaurant specialise en pizzas", "adresse": "Centre-ville", "typeCuisine": "Italienne", "image": "pizza-house.jpg", "fraisLivraison": 5, "horaires": "10:00 - 23:00", "isOpen": true, "owner": "u2" }

Category: { "_id": "c1", "nom": "Pizzas", "description": "Differents types de pizzas", "restaurant": "r1" }

Dish:
{ "_id": "d1", "nom": "Pizza Margherita", "description": "Tomate, mozzarella et basilic", "prix": 15, "image": "pizza.jpg", "disponible": true, "categorie": "c1", "restaurant": "r1" }

Create order (request, the server computes all totals):
{ "restaurant": "r1", "articles": [ { "plat": "d1", "quantite": 2 } ], "adresseLivraison": "Avenue Habib Bourguiba", "modePaiement": "livraison", "remarque": "Sans oignons" }

Order (response):
{ "_id": "o1", "client": "u1", "restaurant": "r1", "articles": [ { "plat": "d1", "nom": "Pizza Margherita", "quantite": 2, "prixUnitaire": 15 } ], "adresseLivraison": "Avenue Habib Bourguiba", "sousTotal": 30, "fraisLivraison": 5, "total": 35, "modePaiement": "livraison", "statut": "en_attente", "remarque": "Sans oignons" }

Update status (request): { "statut": "acceptee" }
Update profile (request, any of these fields): { "nom": "Ali", "prenom": "Ahmed", "telephone": "22123456" }
Update profile response: the User shape above.

Change password (request): { "currentPassword": "Secret123", "newPassword": "NewPass123", "confirmation": "NewPass123" }
Change password response: { "message": "Mot de passe modifié" }  (errors are 400, never 401)

Error: { "message": "Texte de l'erreur" }

Admin users list (response): { "users": [User], "total": 12, "page": 1, "totalPages": 2 }
Admin set status (request): { "isActive": false }   Admin set role (request): { "role": "restaurateur" }
Admin stats (response): { "clients": 3, "restaurants": 3, "orders": 5, "revenue": 120 }