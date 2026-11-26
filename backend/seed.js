// Resets the database with demo data: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Category = require('./models/Category');
const Dish = require('./models/Dish');
const Order = require('./models/Order');

const ADMIN_PASSWORD = 'Admin1234';
const DEMO_PASSWORD = 'Test1234';

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to database:', mongoose.connection.name);

  // 1. Wipe everything so the demo always starts from the same data
  await Promise.all([User, Restaurant, Category, Dish, Order].map((m) => m.deleteMany({})));

  // 2. Users (create() runs the pre-save hook, so passwords are hashed)
  const [, resto1, resto2, client1, client2] = await User.create([
    { nom: 'Admin', prenom: 'FoodExpress', email: 'admin@foodexpress.tn', telephone: '20000001', password: ADMIN_PASSWORD, role: 'admin' },
    { nom: 'Ben Salah', prenom: 'Karim', email: 'resto1@foodexpress.tn', telephone: '20000002', password: DEMO_PASSWORD, role: 'restaurateur' },
    { nom: 'Trabelsi', prenom: 'Sonia', email: 'resto2@foodexpress.tn', telephone: '20000003', password: DEMO_PASSWORD, role: 'restaurateur' },
    { nom: 'Gharbi', prenom: 'Mehdi', email: 'client1@foodexpress.tn', telephone: '20000004', password: DEMO_PASSWORD, role: 'client' },
    { nom: 'Mansouri', prenom: 'Leila', email: 'client2@foodexpress.tn', telephone: '20000005', password: DEMO_PASSWORD, role: 'client' },
    // dedicated account for the "deactivate a test account" part of the demo
    { nom: 'Test', prenom: 'Client', email: 'test.client@foodexpress.tn', telephone: '20000006', password: DEMO_PASSWORD, role: 'client' },
  ]);

  // 3. Restaurants (statutValidation must be 'valide', otherwise public routes hide them)
  const [darPizza, harissa, chezMamma] = await Restaurant.insertMany([
    { nom: 'Dar Pizza', description: 'Pizzas au feu de bois', adresse: 'Avenue Habib Bourguiba, Bizerte', typeCuisine: 'Pizza', fraisLivraison: 3, horaires: '11:00 - 23:00', isOpen: true, owner: resto1._id, statutValidation: 'valide' },
    { nom: 'Harissa Grill', description: 'Grillades et spécialités tunisiennes', adresse: 'Rue de la Corniche, Bizerte', typeCuisine: 'Grillades', fraisLivraison: 2.5, horaires: '12:00 - 00:00', isOpen: true, owner: resto2._id, statutValidation: 'valide' },
    { nom: 'Chez Mamma', description: 'Cuisine traditionnelle comme à la maison', adresse: 'Rue Ibn Khaldoun, Bizerte', typeCuisine: 'Tunisienne', fraisLivraison: 3, horaires: '10:00 - 22:00', isOpen: true, owner: resto1._id, statutValidation: 'valide' },
  ]);

  // 4. Global categories (restaurant = null, usable by every restaurant)
  const categories = await Category.insertMany([
    { nom: 'Entrées', description: 'Pour commencer' },
    { nom: 'Pizzas', description: 'Pizzas' },
    { nom: 'Grillades', description: 'Viandes grillées' },
    { nom: 'Plats tunisiens', description: 'Cuisine traditionnelle' },
    { nom: 'Boissons', description: 'Boissons fraîches et chaudes' },
    { nom: 'Desserts', description: 'Pour finir' },
  ]);
  const cat = Object.fromEntries(categories.map((c) => [c.nom, c._id]));

  // 5. Dishes (one unavailable dish, to test the "unavailable" rule)
  const d = (restaurant, categorie, nom, description, prix, disponible = true) =>
    ({ restaurant: restaurant._id, categorie, nom, description, prix, disponible });

  const dishes = await Dish.insertMany([
    d(darPizza, cat['Pizzas'], 'Pizza Margherita', 'Tomate, mozzarella, basilic', 12),
    d(darPizza, cat['Pizzas'], 'Pizza Reine', 'Tomate, mozzarella, jambon, champignons', 14),
    d(darPizza, cat['Pizzas'], 'Pizza Thon', 'Tomate, mozzarella, thon, olives', 15),
    d(darPizza, cat['Pizzas'], 'Pizza 4 Fromages', 'Mozzarella, gorgonzola, chèvre, parmesan', 16, false),
    d(darPizza, cat['Boissons'], 'Coca-Cola', 'Canette 33cl', 2.5),
    d(harissa, cat['Grillades'], 'Mixed Grill', 'Assortiment de viandes grillées', 22),
    d(harissa, cat['Grillades'], 'Brochettes d\'agneau', 'Servies avec frites et salade', 18),
    d(harissa, cat['Grillades'], 'Kefta grillée', 'Boulettes de viande épicées', 15),
    d(harissa, cat['Entrées'], 'Salade mechouia', 'Poivrons et tomates grillés', 6),
    d(harissa, cat['Boissons'], 'Jus d\'orange', 'Pressé minute', 4),
    d(harissa, cat['Desserts'], 'Baklawa', 'Assortiment de baklawa', 5),
    d(chezMamma, cat['Plats tunisiens'], 'Couscous à l\'agneau', 'Couscous traditionnel aux légumes', 20),
    d(chezMamma, cat['Plats tunisiens'], 'Ojja merguez', 'Œufs, merguez et sauce tomate épicée', 14),
    d(chezMamma, cat['Entrées'], 'Brik à l\'œuf', 'Brik croustillant', 4),
    d(chezMamma, cat['Entrées'], 'Lablabi', 'Soupe de pois chiches', 6),
    d(chezMamma, cat['Boissons'], 'Thé à la menthe', 'Servi avec pignons', 2),
  ]);
  const dish = Object.fromEntries(dishes.map((x) => [x.nom, x]));

  // 6. Orders in different statuses (totals computed like the real API does)
  const makeOrder = (client, restaurant, lines, statut, remarque = '') => {
    const articles = lines.map(([plat, quantite]) => ({
      plat: plat._id, nom: plat.nom, quantite, prixUnitaire: plat.prix,
    }));
    const sousTotal = articles.reduce((sum, a) => sum + a.prixUnitaire * a.quantite, 0);
    return {
      client: client._id,
      restaurant: restaurant._id,
      articles,
      adresseLivraison: '12 rue de la République, Bizerte',
      sousTotal,
      fraisLivraison: restaurant.fraisLivraison,
      total: sousTotal + restaurant.fraisLivraison,
      modePaiement: 'livraison',
      statut,
      remarque,
    };
  };

  await Order.insertMany([
    makeOrder(client1, darPizza, [[dish['Pizza Margherita'], 2], [dish['Coca-Cola'], 1]], 'en_attente', 'Sans oignons'),
    makeOrder(client1, darPizza, [[dish['Pizza Reine'], 1]], 'livree'),
    makeOrder(client1, harissa, [[dish['Brochettes d\'agneau'], 1]], 'acceptee'),
    makeOrder(client2, harissa, [[dish['Mixed Grill'], 2], [dish['Jus d\'orange'], 2]], 'en_preparation'),
    makeOrder(client2, darPizza, [[dish['Pizza Thon'], 1]], 'en_livraison'),
    makeOrder(client2, chezMamma, [[dish['Couscous à l\'agneau'], 1], [dish['Thé à la menthe'], 2]], 'annulee'),
  ]);

  console.log('Seed done: 6 users, 3 restaurants, 6 categories, 16 dishes, 6 orders');
  console.log('Accounts:');
  console.log('  admin          admin@foodexpress.tn        ' + ADMIN_PASSWORD);
  console.log('  restaurateur 1 resto1@foodexpress.tn       ' + DEMO_PASSWORD + '  (Dar Pizza, Chez Mamma)');
  console.log('  restaurateur 2 resto2@foodexpress.tn       ' + DEMO_PASSWORD + '  (Harissa Grill)');
  console.log('  client 1       client1@foodexpress.tn      ' + DEMO_PASSWORD);
  console.log('  client 2       client2@foodexpress.tn      ' + DEMO_PASSWORD);
  console.log('  test client    test.client@foodexpress.tn  ' + DEMO_PASSWORD);

  await mongoose.disconnect();
};

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});