const mongoose = require('mongoose');
const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const { getUserId } = require('../middleware/ownership');
const { round1 } = require('../utils/ratings');

// GET /api/restaurants/:id/reviews   (public)
// Réponse : { reviews: [...], moyenne, total }
exports.list = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Restaurant invalide' });

  const docs = await Review.find({ restaurant: id })
    .sort({ createdAt: -1 })
    .populate('client', 'nom prenom')
    .lean();

  const total = docs.length;
  const moyenne = total ? round1(docs.reduce((s, r) => s + r.note, 0) / total) : 0;
  const reviews = docs.map((r) => ({
    _id: r._id,
    note: r.note,
    commentaire: r.commentaire,
    createdAt: r.createdAt,
    client: r.client ? String(r.client._id) : null,
    // on n'affiche que l'initiale du nom de famille (vie privée)
    auteur: r.client ? `${r.client.prenom} ${(r.client.nom || '')[0] || ''}.` : 'Utilisateur'
  }));
  res.json({ reviews, moyenne, total });
};

// POST /api/restaurants/:id/reviews   (client)   body : { note: 1..5, commentaire? }
// Règle : il faut avoir au moins une commande LIVRÉE dans ce restaurant.
// Un second envoi modifie l'avis existant (pas de doublon).
exports.create = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Restaurant invalide' });

  const note = Number(req.body.note);
  if (!Number.isInteger(note) || note < 1 || note > 5) {
    return res.status(400).json({ message: 'La note doit être un entier entre 1 et 5' });
  }
  const commentaire = String(req.body.commentaire || '').trim();
  if (commentaire.length > 500) {
    return res.status(400).json({ message: 'Commentaire trop long (500 caractères maximum)' });
  }

  const restaurant = await Restaurant.findOne({ _id: id, statutValidation: 'valide' });
  if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable' });

  const clientId = getUserId(req);
  const delivered = await Order.exists({ client: clientId, restaurant: id, statut: 'livree' });
  if (!delivered) {
    return res.status(403).json({ message: 'Vous pouvez noter ce restaurant après une commande livrée' });
  }

  const review = await Review.findOneAndUpdate(
    { restaurant: id, client: clientId },
    { note, commentaire },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.status(201).json(review);
};
