const mongoose = require('mongoose');
const Dish = require('../models/Dish');
const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const { ownsRestaurant } = require('../middleware/ownership');

exports.getAll = async (req, res) => {
  const filter = {};
  if (req.query.restaurant) filter.restaurant = req.query.restaurant;
  const category = req.query.category || req.query.categorie; // contrat : ?category=
  if (category) filter.categorie = category;
  if (req.query.disponible !== undefined) filter.disponible = req.query.disponible === 'true';
  const dishes = await Dish.find(filter)
    .sort({ nom: 1 });
  res.json(dishes);
};

exports.getById = async (req, res) => {
  const dish = await Dish.findById(req.params.id);
  if (!dish) return res.status(404).json({ message: 'Plat introuvable' });
  res.json(dish);
};

exports.create = async (req, res) => {
  const { nom, prix, restaurant, categorie = null, description = '', image = '', disponible = true } = req.body;
  if (!nom || prix === undefined || !restaurant) {
    return res.status(400).json({ message: 'nom, prix et restaurant sont obligatoires' });
  }
  if (!mongoose.isValidObjectId(restaurant) || !(await ownsRestaurant(req, restaurant))) {
    return res.status(403).json({ message: 'Restaurant non autorisé' });
  }
  if (categorie) {
    const cat = await Category.findById(categorie);
    if (!cat) return res.status(404).json({ message: 'Catégorie introuvable' });
    if (cat.restaurant && String(cat.restaurant) !== String(restaurant)) {
      return res.status(400).json({ message: 'Cette catégorie appartient à un autre restaurant' });
    }
  }
  const dish = await Dish.create({ nom, prix, restaurant, categorie, description, image, disponible });
  res.status(201).json(dish);
};

exports.update = async (req, res) => {
  const dish = await Dish.findById(req.params.id);
  if (!dish) return res.status(404).json({ message: 'Plat introuvable' });
  if (!(await ownsRestaurant(req, dish.restaurant))) {
    return res.status(403).json({ message: 'Modification non autorisée' });
  }
  const allowed = ['nom', 'description', 'prix', 'image', 'disponible', 'categorie'];
  allowed.forEach(key => { if (req.body[key] !== undefined) dish[key] = req.body[key]; });
  if (dish.categorie) {
    const cat = await Category.findById(dish.categorie);
    if (!cat) return res.status(404).json({ message: 'Catégorie introuvable' });
    if (cat.restaurant && String(cat.restaurant) !== String(dish.restaurant)) {
      return res.status(400).json({ message: 'Catégorie d’un autre restaurant' });
    }
  }
  await dish.save();
  res.json(dish);
};

exports.remove = async (req, res) => {
  const dish = await Dish.findById(req.params.id);
  if (!dish) return res.status(404).json({ message: 'Plat introuvable' });
  if (!(await ownsRestaurant(req, dish.restaurant))) {
    return res.status(403).json({ message: 'Suppression non autorisée' });
  }
  await Dish.findByIdAndDelete(dish._id);
  res.status(200).json({ message: 'Plat supprimé avec succès' });
};
