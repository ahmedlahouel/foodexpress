// Owner: Bassem
// TODO: define the Category Mongoose schema (fields in docs/api-contract.md)
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  // A category can be global (restaurant absent) or attached to one restaurant.
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
