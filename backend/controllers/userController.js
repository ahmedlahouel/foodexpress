// Owner: Ahmed
const User = require('../models/User');
const { PASSWORD_RULE } = require('./authController');

const getMe = (req, res) => {
  res.json(req.user);
};

const updateMe = async (req, res, next) => {
  try {
    // Only these fields can be edited: email and role are never taken from the body
    const { nom, prenom, telephone } = req.body;
    const updates = { nom, prenom, telephone };

    for (const [field, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      if (typeof value !== 'string' || !value.trim()) {
        return res.status(400).json({ message: `Le champ ${field} est invalide` });
      }
      req.user[field] = value.trim();
    }

    await req.user.save();
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmation } = req.body;
    if (!currentPassword || !newPassword || !confirmation) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }
    if (newPassword !== confirmation) {
      return res.status(400).json({ message: 'La confirmation ne correspond pas au nouveau mot de passe' });
    }
    if (!PASSWORD_RULE.test(newPassword)) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    // 400 and not 401: a 401 would make the Angular interceptor log the user out
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Mot de passe modifié' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe, changePassword };
