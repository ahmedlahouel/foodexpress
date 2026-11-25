// src/app/core/mock/mock-data.ts
// Mock data following the FoodExpress API contract (money in DT, ids are strings).

export type Role = 'client' | 'restaurateur' | 'admin';
export type Statut =
  | 'en_attente' | 'acceptee' | 'en_preparation'
  | 'en_livraison' | 'livree' | 'annulee';

export interface User {
  _id: string; nom: string; prenom: string; email: string;
  telephone: string; role: Role; isActive: boolean;
}
export interface Restaurant {
  _id: string; nom: string; description: string; adresse: string;
  typeCuisine: string; image: string; fraisLivraison: number;
  horaires: string; isOpen: boolean; owner: string;
  validation?: 'en_attente' | 'validee' | 'suspendue'; // absent = validee
}
export interface Category { _id: string; nom: string; description: string; restaurant: string; }
export interface Dish {
  _id: string; nom: string; description: string; prix: number;
  image: string; disponible: boolean; categorie: string; restaurant: string;
}
export interface OrderLine { plat: string; nom: string; quantite: number; prixUnitaire: number; }
export interface Order {
  _id: string; client: string; restaurant: string; articles: OrderLine[];
  adresseLivraison: string; sousTotal: number; fraisLivraison: number; total: number;
  modePaiement: string; statut: Statut; remarque?: string;
}

// All mock accounts use the password "Secret123"
export const MOCK_PASSWORD = 'Secret123';

export const MOCK_USERS: User[] = [
  { _id: 'u1', nom: 'Ali', prenom: 'Ahmed', email: 'client@foodexpress.tn', telephone: '22123456', role: 'client', isActive: true },
  { _id: 'u2', nom: 'Ben Salah', prenom: 'Sami', email: 'resto@foodexpress.tn', telephone: '55123456', role: 'restaurateur', isActive: true },
  { _id: 'u3', nom: 'Admin', prenom: 'Super', email: 'admin@foodexpress.tn', telephone: '98123456', role: 'admin', isActive: true },
  { _id: 'u4', nom: 'Trabelsi', prenom: 'Mariem', email: 'inactif@foodexpress.tn', telephone: '21123456', role: 'client', isActive: false },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  { _id: 'r1', nom: 'Pizza House', description: 'Restaurant specialise en pizzas', adresse: 'Centre-ville', typeCuisine: 'Italienne', image: 'pizza-house.jpg', fraisLivraison: 5, horaires: '10:00 - 23:00', isOpen: true, owner: 'u2' },
  { _id: 'r2', nom: 'Harissa Grill', description: 'Grillades et specialites tunisiennes', adresse: 'La Marsa', typeCuisine: 'Tunisienne', image: 'harissa-grill.jpg', fraisLivraison: 4, horaires: '11:00 - 22:00', isOpen: true, owner: 'u2' },
  { _id: 'r3', nom: 'Burger Corner', description: 'Burgers maison et frites', adresse: 'Lac 2', typeCuisine: 'Fast-food', image: 'burger-corner.jpg', fraisLivraison: 6, horaires: '12:00 - 00:00', isOpen: false, owner: 'u2' },
];

export const MOCK_CATEGORIES: Category[] = [
  { _id: 'c1', nom: 'Pizzas', description: 'Differents types de pizzas', restaurant: 'r1' },
  { _id: 'c2', nom: 'Boissons', description: 'Boissons fraiches', restaurant: 'r1' },
  { _id: 'c3', nom: 'Grillades', description: 'Viandes grillees', restaurant: 'r2' },
  { _id: 'c4', nom: 'Entrees', description: 'Salades et brik', restaurant: 'r2' },
  { _id: 'c5', nom: 'Burgers', description: 'Burgers maison', restaurant: 'r3' },
];

export const MOCK_DISHES: Dish[] = [
  { _id: 'd1', nom: 'Pizza Margherita', description: 'Tomate, mozzarella et basilic', prix: 15, image: 'pizza.jpg', disponible: true, categorie: 'c1', restaurant: 'r1' },
  { _id: 'd2', nom: 'Pizza Quatre Fromages', description: 'Mozzarella, emmental, chevre, bleu', prix: 18, image: 'pizza4f.jpg', disponible: true, categorie: 'c1', restaurant: 'r1' },
  { _id: 'd3', nom: 'Pizza Thon', description: 'Thon, olives, oignons', prix: 17, image: 'pizza-thon.jpg', disponible: false, categorie: 'c1', restaurant: 'r1' },
  { _id: 'd4', nom: 'Coca-Cola 33cl', description: 'Canette', prix: 3, image: 'coca.jpg', disponible: true, categorie: 'c2', restaurant: 'r1' },
  { _id: 'd5', nom: 'Brochettes mixtes', description: 'Agneau et poulet grilles', prix: 22, image: 'brochettes.jpg', disponible: true, categorie: 'c3', restaurant: 'r2' },
  { _id: 'd6', nom: 'Merguez grillees', description: 'Avec harissa et frites', prix: 14, image: 'merguez.jpg', disponible: true, categorie: 'c3', restaurant: 'r2' },
  { _id: 'd7', nom: 'Brik a l\'oeuf', description: 'Thon, oeuf, persil', prix: 4, image: 'brik.jpg', disponible: true, categorie: 'c4', restaurant: 'r2' },
  { _id: 'd8', nom: 'Salade mechouia', description: 'Poivrons et tomates grilles', prix: 6, image: 'mechouia.jpg', disponible: true, categorie: 'c4', restaurant: 'r2' },
  { _id: 'd9', nom: 'Cheeseburger', description: 'Boeuf, cheddar, sauce maison', prix: 13, image: 'cheeseburger.jpg', disponible: true, categorie: 'c5', restaurant: 'r3' },
];

export const MOCK_ORDERS: Order[] = [
  {
    _id: 'o1', client: 'u1', restaurant: 'r1',
    articles: [{ plat: 'd1', nom: 'Pizza Margherita', quantite: 2, prixUnitaire: 15 }],
    adresseLivraison: 'Avenue Habib Bourguiba', sousTotal: 30, fraisLivraison: 5, total: 35,
    modePaiement: 'livraison', statut: 'en_attente', remarque: 'Sans oignons',
  },
  {
    _id: 'o2', client: 'u1', restaurant: 'r2',
    articles: [
      { plat: 'd5', nom: 'Brochettes mixtes', quantite: 1, prixUnitaire: 22 },
      { plat: 'd7', nom: 'Brik a l\'oeuf', quantite: 2, prixUnitaire: 4 },
    ],
    adresseLivraison: 'Rue de Marseille, Tunis', sousTotal: 30, fraisLivraison: 4, total: 34,
    modePaiement: 'livraison', statut: 'en_livraison',
  },
  {
    _id: 'o3', client: 'u1', restaurant: 'r1',
    articles: [{ plat: 'd2', nom: 'Pizza Quatre Fromages', quantite: 1, prixUnitaire: 18 }],
    adresseLivraison: 'Avenue Habib Bourguiba', sousTotal: 18, fraisLivraison: 5, total: 23,
    modePaiement: 'livraison', statut: 'livree',
  },
];
