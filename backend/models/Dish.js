// Owner: Bassem
// TODO: define the Dish Mongoose schema (fields in docs/api-contract.md)
const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  prix: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  disponible: { type: Boolean, default: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Dish', dishSchema);
