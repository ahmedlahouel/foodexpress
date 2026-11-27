const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: Number, required: true, min: 1, max: 5 },
  commentaire: { type: String, default: '', trim: true, maxlength: 500 }
}, { timestamps: true });

// Un client ne peut laisser qu'un seul avis par restaurant (il peut le modifier)
reviewSchema.index({ restaurant: 1, client: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
