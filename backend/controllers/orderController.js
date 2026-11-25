const mongoose = require('mongoose');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const { getUserId, ownsRestaurant } = require('../middleware/ownership');

const NEXT_STATUS = {
  en_attente: ['acceptee', 'annulee'],
  acceptee: ['en_preparation', 'annulee'],
  en_preparation: ['en_livraison'],
  en_livraison: ['livree'],
  livree: [],
  annulee: []
};

exports.create = async (req, res) => {
  const { restaurant, articles, adresseLivraison, remarque = '', modePaiement = 'livraison' } = req.body;
  if (!restaurant || !mongoose.isValidObjectId(restaurant)) {
    return res.status(400).json({ message: 'Restaurant invalide' });
  }
  if (!Array.isArray(articles) || articles.length === 0) {
    return res.status(400).json({ message: 'La commande doit contenir au moins un article' });
  }
  if (!adresseLivraison || !adresseLivraison.trim()) {
    return res.status(400).json({ message: 'adresseLivraison obligatoire' });
  }
  if (modePaiement !== 'livraison') {
    return res.status(400).json({ message: 'Mode de paiement non disponible' });
  }

  const restaurantDoc = await Restaurant.findOne({ _id: restaurant, statutValidation: 'valide', isOpen: true });
  if (!restaurantDoc) return res.status(400).json({ message: 'Restaurant indisponible' });

  const lignes = [];
  let sousTotal = 0;

  for (const item of articles) {
    if (!item.plat || !mongoose.isValidObjectId(item.plat)) {
      return res.status(400).json({ message: 'Identifiant de plat invalide' });
    }
    const quantite = Number(item.quantite);
    if (!Number.isInteger(quantite) || quantite < 1) {
      return res.status(400).json({ message: 'Chaque quantité doit être un entier supérieur ou égal à 1' });
    }
    const dish = await Dish.findOne({
      _id: item.plat, restaurant: restaurantDoc._id, disponible: true
    });
    if (!dish) return res.status(400).json({ message: 'Un plat est indisponible ou ne correspond pas au restaurant' });

    lignes.push({
      plat: dish._id,
      nom: dish.nom,
      quantite,
      prixUnitaire: dish.prix
    });
    sousTotal += dish.prix * quantite;
  }

  // The delivery fee and prices are read from MongoDB, never trusted from the client.
  const fraisLivraison = restaurantDoc.fraisLivraison;
  const total = sousTotal + fraisLivraison;

  const order = await Order.create({
    client: getUserId(req),
    restaurant: restaurantDoc._id,
    articles: lignes,
    adresseLivraison,
    sousTotal,
    fraisLivraison,
    total,
    modePaiement,
    remarque
  });
  res.status(201).json(order);
};

exports.myOrders = async (req, res) => {
  const orders = await Order.find({ client: getUserId(req) })
    .sort({ createdAt: -1 });
  res.json(orders);
};

exports.restaurantOrders = async (req, res) => {
  const restaurants = await Restaurant.find({ owner: getUserId(req) }).select('_id');
  const ids = restaurants.map(r => r._id);
  const orders = await Order.find({ restaurant: { $in: ids } })
    .populate('client', 'nom prenom email telephone')
    .populate('restaurant', 'nom')
    .sort({ createdAt: -1 });
  res.json(orders);
};

exports.updateStatus = async (req, res) => {
  const { statut } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Commande introuvable' });
  if (!(await ownsRestaurant(req, order.restaurant))) {
    return res.status(403).json({ message: 'Vous ne pouvez modifier que les commandes de votre restaurant' });
  }
  if (!Object.prototype.hasOwnProperty.call(NEXT_STATUS, statut)) {
    return res.status(400).json({ message: 'Statut inconnu' });
  }
  if (!NEXT_STATUS[order.statut].includes(statut)) {
    return res.status(400).json({ message: `Transition impossible: ${order.statut} vers ${statut}` });
  }
  if (order.statut === 'livree') {
    return res.status(400).json({ message: 'Une commande livrée est verrouillée' });
  }
  order.statut = statut;
  await order.save();
  res.json(order);
};

exports.restaurantStats = async (req, res) => {
  const restaurants = await Restaurant.find({ owner: getUserId(req) }).select('_id');
  const ids = restaurants.map(r => r._id);
  const match = { restaurant: { $in: ids } };

  const [totals] = await Order.aggregate([
    { $match: match },
    { $group: {
      _id: null,
      totalCommandes: { $sum: 1 },
      enAttente: { $sum: { $cond: [{ $eq: ['$statut', 'en_attente'] }, 1, 0] } },
      acceptees: { $sum: { $cond: [{ $eq: ['$statut', 'acceptee'] }, 1, 0] } },
      chiffreAffaires: { $sum: { $cond: [{ $in: ['$statut', ['acceptee', 'en_preparation', 'en_livraison', 'livree']] }, '$total', 0] } }
    }}
  ]);

  const platsPopulaires = await Order.aggregate([
    { $match: match },
    { $unwind: '$articles' },
    { $group: {
      _id: '$articles.plat',
      nom: { $first: '$articles.nom' },
      quantiteTotale: { $sum: '$articles.quantite' }
    }},
    { $sort: { quantiteTotale: -1 } },
    { $limit: 5 }
  ]);

  res.json({
    totalCommandes: totals ? totals.totalCommandes : 0,
    enAttente: totals ? totals.enAttente : 0,
    acceptees: totals ? totals.acceptees : 0,
    chiffreAffaires: totals ? totals.chiffreAffaires : 0,
    platsPopulaires
  });
};
