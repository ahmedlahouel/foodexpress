const mongoose = require('mongoose');

function getUserId(req) {
  return req.user && (req.user._id || req.user.id);
}

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

async function ownsRestaurant(req, restaurantId) {
  if (!mongoose.isValidObjectId(restaurantId)) return false;
  const Restaurant = require('../models/Restaurant');
  const restaurant = await Restaurant.findById(restaurantId).select('owner');
  if (!restaurant) return false;
  return String(restaurant.owner) === String(getUserId(req));
}

module.exports = { getUserId, isAdmin, ownsRestaurant };
