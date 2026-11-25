// Middleware global de gestion des erreurs :
// analyse les erreurs et retourne une réponse HTTP adaptée au client.
module.exports = function errorHandler(err, req, res, next) {

  // Affiche l'erreur dans la console pour faciliter le débogage.
  console.error(err);

  // Gère les erreurs de validation des données et retourne le code 400.
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  // Gère les erreurs liées à un identifiant invalide.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Identifiant invalide' });
  }

  // Gère les erreurs de duplication (valeur déjà existante dans la base de données).
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Valeur déjà utilisée' });
  }

  // Gère les autres erreurs et retourne un code HTTP approprié
  // ou 500 par défaut en cas d'erreur serveur.
  res.status(err.status || 500).json({
    message: err.message || 'Erreur serveur'
  });
};