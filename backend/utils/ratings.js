// Ajoute noteMoyenne et nbAvis à des restaurants (objets simples, obtenus avec .lean()).
// Fichier utilitaire à part : les fonctions des controllers sont enveloppées par wrapAll.
const Review = require('../models/Review');

const round1 = (n) => Math.round(n * 10) / 10;

async function withRatings(restaurants) {
  if (!restaurants.length) return restaurants;
  const agg = await Review.aggregate([
    { $match: { restaurant: { $in: restaurants.map((r) => r._id) } } },
    { $group: { _id: '$restaurant', moyenne: { $avg: '$note' }, total: { $sum: 1 } } }
  ]);
  const byId = new Map(agg.map((a) => [String(a._id), a]));
  return restaurants.map((r) => {
    const a = byId.get(String(r._id));
    return { ...r, noteMoyenne: a ? round1(a.moyenne) : 0, nbAvis: a ? a.total : 0 };
  });
}

const withRating = async (restaurant) => (await withRatings([restaurant]))[0];

module.exports = { withRatings, withRating, round1 };
