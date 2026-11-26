// Owner: Ahmed
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// At least 8 characters, with at least one letter and one digit
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const authResponse = (user) => ({
  token: signToken(user),
  user: {
    _id: user._id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    telephone: user.telephone,
    role: user.role,
    isActive: user.isActive,
  },
});

const register = async (req, res, next) => {
  try {
    const { nom, prenom, email, telephone, password, confirmation } = req.body;

    if (!nom || !prenom || !email || !telephone || !password || !confirmation) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }
    if (password !== confirmation) {
      return res.status(400).json({ message: 'La confirmation ne correspond pas au mot de passe' });
    }
    if (!PASSWORD_RULE.test(password)) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre',
      });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    // The role is never read from the request body: new accounts are always clients
    const user = await User.create({ nom, prenom, email, telephone, password });
    res.status(201).json(authResponse(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe obligatoires' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    res.json(authResponse(user));
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, PASSWORD_RULE };
