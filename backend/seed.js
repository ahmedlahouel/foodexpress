// Resets the database with demo data: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Category = require('./models/Category');
const Dish = require('./models/Dish');
const Order = require('./models/Order');
const Review = require('./models/Review');

const ADMIN_PASSWORD = 'Admin1234';
const DEMO_PASSWORD = 'Test1234';

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to database:', mongoose.connection.name);

  // 1. Wipe everything so the demo always starts from the same data
  await Promise.all([User, Restaurant, Category, Dish, Order, Review].map((m) => m.deleteMany({})));

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
  const [darPizza, harissa, chezMamma, burgerCorner, sakura, beyrouth, dolceVita, sweetCorner] = await Restaurant.insertMany([
    { nom: 'Dar Pizza', image: 'dar-pizza.jpg', description: 'Pizzas au feu de bois', adresse: 'Avenue Habib Bourguiba, Bizerte', typeCuisine: 'Pizza', fraisLivraison: 3, horaires: '11:00 - 23:00', isOpen: true, owner: resto1._id, statutValidation: 'valide', latitude: 37.2744, longitude: 9.8739 },
    { nom: 'Harissa Grill', image: 'harissa-grill.jpg', description: 'Grillades et spécialités tunisiennes', adresse: 'Rue de la Corniche, Bizerte', typeCuisine: 'Grillades', fraisLivraison: 2.5, horaires: '12:00 - 00:00', isOpen: true, owner: resto2._id, statutValidation: 'valide', latitude: 37.2830, longitude: 9.8860 },
    { nom: 'Chez Mamma', image: 'chez-mamma.jpg', description: 'Cuisine traditionnelle comme à la maison', adresse: 'Rue Ibn Khaldoun, Bizerte', typeCuisine: 'Tunisienne', fraisLivraison: 3, horaires: '10:00 - 22:00', isOpen: true, owner: resto1._id, statutValidation: 'valide', latitude: 37.2712, longitude: 9.8695 },
    { nom: 'Burger Corner', image: 'burger-corner.jpg', description: 'Burgers maison et frites croustillantes', adresse: 'Avenue de la République, Bizerte', typeCuisine: 'Burgers', fraisLivraison: 3.5, horaires: '12:00 - 01:00', isOpen: true, owner: resto2._id, statutValidation: 'valide', latitude: 37.2768, longitude: 9.8702 },
    { nom: 'Sakura Sushi', image: 'sakura-sushi.jpg', description: 'Sushi, makis et spécialités japonaises', adresse: 'Rue du Vieux Port, Bizerte', typeCuisine: 'Japonaise', fraisLivraison: 4, horaires: '12:00 - 23:00', isOpen: true, owner: resto1._id, statutValidation: 'valide', latitude: 37.2745, longitude: 9.8742 },
    { nom: 'Beyrouth Express', image: 'beyrouth-express.jpg', description: 'Chawarma, mezze et falafel', adresse: 'Rue Ali Belhouane, Bizerte', typeCuisine: 'Libanaise', fraisLivraison: 3, horaires: '11:00 - 00:00', isOpen: true, owner: resto2._id, statutValidation: 'valide', latitude: 37.2731, longitude: 9.8718 },
    { nom: 'La Dolce Vita', image: 'la-dolce-vita.jpg', description: 'Pâtes fraîches, lasagnes et risottos', adresse: 'Rue de Palestine, Bizerte', typeCuisine: 'Italienne', fraisLivraison: 3, horaires: '11:30 - 23:00', isOpen: false, owner: resto1._id, statutValidation: 'valide', latitude: 37.2790, longitude: 9.8801 },
    { nom: 'Sweet Corner', image: 'sweet-corner.jpg', description: 'Crêpes, gaufres, glaces et cafés', adresse: 'Corniche de Bizerte', typeCuisine: 'Desserts', fraisLivraison: 2, horaires: '14:00 - 00:00', isOpen: true, owner: resto2._id, statutValidation: 'valide', latitude: 37.2851, longitude: 9.8912 },
  ]);

  // 4. Global categories (restaurant = null, usable by every restaurant)
  const categories = await Category.insertMany([
    { nom: 'Entrées', description: 'Pour commencer' },
    { nom: 'Pizzas', description: 'Pizzas' },
    { nom: 'Grillades', description: 'Viandes grillées' },
    { nom: 'Plats tunisiens', description: 'Cuisine traditionnelle' },
    { nom: 'Boissons', description: 'Boissons fraîches et chaudes' },
    { nom: 'Desserts', description: 'Pour finir' },
    { nom: 'Burgers', description: 'Burgers et sandwichs' },
    { nom: 'Sushi', description: 'Sushi, makis et sashimi' },
    { nom: 'Libanais', description: 'Mezze et spécialités libanaises' },
    { nom: 'Pâtes', description: 'Pâtes et plats italiens' },
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
    d(burgerCorner, cat['Burgers'], 'Cheese Burger', 'Steak, cheddar, salade, sauce maison', 11),
    d(burgerCorner, cat['Burgers'], 'Double Beef', 'Double steak, bacon, oignons caramélisés', 16),
    d(burgerCorner, cat['Burgers'], 'Chicken Crispy', 'Poulet pané, salade, sauce BBQ', 12),
    d(burgerCorner, cat['Boissons'], 'Milkshake vanille', 'Servi bien frais', 6),
    d(sakura, cat['Sushi'], 'Plateau Sushi (12 pièces)', 'Assortiment de nigiris et makis', 28),
    d(sakura, cat['Sushi'], 'California Roll', 'Surimi, avocat, concombre', 14),
    d(sakura, cat['Sushi'], 'Maki Saumon', '6 pièces de maki au saumon frais', 12),
    d(sakura, cat['Entrées'], 'Soupe miso', 'Soupe japonaise traditionnelle', 5),
    d(beyrouth, cat['Libanais'], 'Chawarma poulet', 'Pain libanais, poulet, ail, pickles', 9),
    d(beyrouth, cat['Libanais'], 'Assiette mezze', 'Houmous, taboulé, moutabal, falafel', 18),
    d(beyrouth, cat['Libanais'], 'Falafel sandwich', 'Falafel, tahini, légumes frais', 7),
    d(dolceVita, cat['Pâtes'], 'Spaghetti carbonara', 'Crème, lardons, parmesan', 14),
    d(dolceVita, cat['Pâtes'], 'Lasagnes bolognaise', 'Gratinées au four', 16),
    d(dolceVita, cat['Pâtes'], 'Penne arrabbiata', 'Sauce tomate pimentée', 12),
    d(sweetCorner, cat['Desserts'], 'Crêpe Nutella', 'Crêpe chaude au Nutella', 6),
    d(sweetCorner, cat['Desserts'], 'Gaufre fruits', 'Gaufre, fruits frais et chantilly', 9),
    d(sweetCorner, cat['Boissons'], 'Café gourmand', 'Café et mini desserts', 7),
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

  // 7. Quelques avis pour la démo
  await Review.insertMany([
    { restaurant: darPizza._id, client: client1._id, note: 5, commentaire: 'Pizza délicieuse, livraison rapide !' },
    { restaurant: darPizza._id, client: client2._id, note: 4, commentaire: 'Très bon, un peu de retard.' },
    { restaurant: harissa._id, client: client1._id, note: 5, commentaire: 'Les meilleures grillades de la ville.' },
    { restaurant: sakura._id, client: client2._id, note: 5, commentaire: 'Sushis très frais, présentation soignée.' },
    { restaurant: burgerCorner._id, client: client1._id, note: 4, commentaire: 'Burgers généreux, bonnes frites.' },
  ]);

  console.log('Seed done: 6 users, 8 restaurants, 10 categories, 33 dishes, 6 orders');
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