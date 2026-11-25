// Owner: Bassem
// TODO: define the Order Mongoose schema (fields in docs/api-contract.md)
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  plat: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
  nom: { type: String, required: true },
  quantite: { type: Number, required: true, min: 1 },
  prixUnitaire: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  articles: {
    type: [orderItemSchema],
    validate: {
      validator: value => Array.isArray(value) && value.length > 0,
      message: 'Une commande doit contenir au moins un article'
    }
  },
  adresseLivraison: { type: String, required: true, trim: true },
  sousTotal: { type: Number, required: true, min: 0 },
  fraisLivraison: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  modePaiement: { type: String, enum: ['livraison'], default: 'livraison' },
  statut: {
    type: String,
    enum: ['en_attente', 'acceptee', 'en_preparation', 'en_livraison', 'livree', 'annulee'],
    default: 'en_attente'
  },
  remarque: { type: String, default: '', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
