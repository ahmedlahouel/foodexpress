// Owner: Ahmed. Admin API: users management and global statistics
const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

const ROLES = ['client', 'restaurateur', 'admin'];
// Same revenue rule as Bassem's restaurant stats: cancelled and pending orders do not count
const REVENUE_STATUSES = ['acceptee', 'en_preparation', 'en_livraison', 'livree'];

// Escape special characters so a search cannot inject a regex
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/users?search=&role=&page=&limit=
const listUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.search) {
      const regex = { $regex: escapeRegex(req.query.search), $options: 'i' };
      filter.$or = [{ nom: regex }, { prenom: regex }, { email: regex }];
    }
    if (ROLES.includes(req.query.role)) filter.role = req.query.role;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/status   body: { "isActive": false }
const setUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive doit être true ou false' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre compte' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/role   body: { "role": "restaurateur" }
// This is how a restaurateur account is created: register as client, then the admin changes the role
const setUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    // 14 derniers jours pour la courbe du chiffre d'affaires
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [clients, restaurants, orders, revenueAgg, statusAgg, dayAgg] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      Restaurant.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { statut: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // bonus : nombre de commandes par statut
      Order.aggregate([{ $group: { _id: '$statut', count: { $sum: 1 } } }]),
      // bonus : chiffre d'affaires par jour
      Order.aggregate([
        { $match: { statut: { $in: REVENUE_STATUSES }, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      clients,
      restaurants,
      orders,
      revenue: revenueAgg.length ? revenueAgg[0].total : 0,
      ordersByStatus: Object.fromEntries(statusAgg.map((s) => [s._id, s.count])),
      revenueByDay: dayAgg.map((d) => ({ date: d._id, total: d.total })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, setUserStatus, setUserRole, getStats };