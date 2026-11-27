const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const { getUserId, isAdmin } = require('../middleware/ownership');
const { withRatings, withRating } = require('../utils/ratings');

// Échappe les caractères spéciaux pour éviter l'injection de regex
const escapeRegex = str => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/restaurants?search=&cuisine=&open=true&sort=nom   (docs/api-contract.md)
// Réponse : tableau. Pagination optionnelle (?page=&limit=) : totaux dans les en-têtes
// X-Total-Count et X-Total-Pages. Anciens noms (nom, typeCuisine, openOnly) toujours acceptés.
exports.getAll = async (req, res) => {
  const filter = { statutValidation: 'valide' };
  const search = req.query.search || req.query.nom;
  const cuisine = req.query.cuisine || req.query.typeCuisine;
  const open = req.query.open !== undefined ? req.query.open : req.query.openOnly;
  if (search) filter.nom = { $regex: escapeRegex(search), $options: 'i' };
  if (cuisine) filter.typeCuisine = { $regex: `^${escapeRegex(cuisine)}$`, $options: 'i' };
  if (open === 'true') filter.isOpen = true;

  const direction = ['-nom', 'desc'].includes(req.query.sort) ? -1 : 1; // tri alphabétique
  let query = Restaurant.find(filter).sort({ nom: direction });

  if (req.query.page || req.query.limit) {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const total = await Restaurant.countDocuments(filter);
    res.set('X-Total-Count', String(total));
    res.set('X-Total-Pages', String(Math.ceil(total / limit)));
    query = query.skip((page - 1) * limit).limit(limit);
  }
  res.json(await withRatings(await query.lean()));
};

// Restaurateur : voir ses propres restaurants (tous statuts)
exports.getMine = async (req, res) => {
  const restaurants = await Restaurant.find({ owner: getUserId(req) }).sort({ nom: 1 });
  res.json(restaurants);
};

// Admin : voir tous les restaurants, filtre optionnel ?statutValidation=en_attente
exports.getAllAdmin = async (req, res) => {
  const filter = {};
  if (['en_attente', 'valide', 'suspendu'].includes(req.query.statutValidation)) {
    filter.statutValidation = req.query.statutValidation;
  }
  const restaurants = await Restaurant.find(filter).populate('owner', 'nom prenom email').sort({ nom: 1 });
  res.json(restaurants);
};

exports.getById = async (req, res) => {
  const restaurant = await Restaurant.findOne({ _id: req.params.id, statutValidation: 'valide' }).lean();
  if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable' });
  res.json(await withRating(restaurant));
};

// According to the agreed work split, creation/deletion and validation are admin actions.
exports.create = async (req, res) => {
  const { nom, description, adresse, typeCuisine, image, fraisLivraison, horaires, isOpen, owner } = req.body;
  if (!nom || !adresse || !typeCuisine || !owner) {
    return res.status(400).json({ message: 'nom, adresse, typeCuisine et owner sont obligatoires' });
  }
  if (!mongoose.isValidObjectId(owner)) return res.status(400).json({ message: 'owner invalide' });
  const restaurant = await Restaurant.create({
    nom, description, adresse, typeCuisine, image, fraisLivraison, horaires, isOpen, owner
  });
  res.status(201).json(restaurant);
};

exports.update = async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable' });
  if (!isAdmin(req) && String(restaurant.owner) !== String(getUserId(req))) {
    return res.status(403).json({ message: 'Vous ne pouvez modifier que votre restaurant' });
  }
  const allowed = ['nom', 'description', 'adresse', 'typeCuisine', 'image', 'fraisLivraison', 'horaires', 'isOpen'];
  allowed.forEach(key => { if (req.body[key] !== undefined) restaurant[key] = req.body[key]; });
  await restaurant.save();
  res.json(restaurant);
};

exports.remove = async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable' });
  await Dish.deleteMany({ restaurant: restaurant._id });
  await Restaurant.findByIdAndDelete(restaurant._id);
  res.status(200).json({ message: 'Restaurant supprimé avec succès' });
};

exports.setValidation = async (req, res) => {
  const { statutValidation } = req.body;
  if (!['valide', 'suspendu', 'en_attente'].includes(statutValidation)) {
    return res.status(400).json({ message: 'statutValidation invalide' });
  }
  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id, { statutValidation }, { new: true, runValidators: true }
  );
  if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable' });
  res.json(restaurant);
};
