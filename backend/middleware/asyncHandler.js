// Fonction qui intercepte automatiquement les erreurs des fonctions asynchrones
// et les transmet au middleware global de gestion des erreurs.
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Fonction qui applique automatiquement asyncHandler à toutes les fonctions
// exportées d'un controller afin de centraliser la gestion des erreurs.
const wrapAll = controller =>
    Object.fromEntries(
        Object.entries(controller).map(([name, fn]) => [
            name,
            typeof fn === 'function' ? asyncHandler(fn) : fn
        ])
    );

module.exports = { asyncHandler, wrapAll };