const Category = require('../models/Category');
const { isAdmin, ownsRestaurant } = require('../middleware/ownership');

exports.getAll = async (req, res) => {
  const filter = {};
  if (req.query.restaurant) filter.$or = [{ restaurant: req.query.restaurant }, { restaurant: null }];
  const categories = await Category.find(filter).sort({ nom: 1 });
  res.json(categories);
};

exports.create = async (req, res) => {
  const { nom, description = '', restaurant = null } = req.body;
  if (!nom) return res.status(400).json({ message: 'nom est obligatoire' });
  if (!isAdmin(req)) {
    if (!restaurant || !(await ownsRestaurant(req, restaurant))) {
      return res.status(403).json({ message: 'Catégorie réservée à votre restaurant' });
    }
  }
  const category = await Category.create({ nom, description, restaurant });
  res.status(201).json(category);
};

exports.update = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });
  if (!isAdmin(req) && (!category.restaurant || !(await ownsRestaurant(req, category.restaurant)))) {
    return res.status(403).json({ message: 'Modification non autorisée' });
  }
  if (req.body.nom !== undefined) category.nom = req.body.nom;
  if (req.body.description !== undefined) category.description = req.body.description;
  await category.save();
  res.json(category);
};

exports.remove = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });
  if (!isAdmin(req) && (!category.restaurant || !(await ownsRestaurant(req, category.restaurant)))) {
    return res.status(403).json({ message: 'Suppression non autorisée' });
  }
  await Category.findByIdAndDelete(category._id);
  res.status(200).json({ message: 'Catégorie supprimée avec succès' });
};
