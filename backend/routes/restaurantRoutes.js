const router = require('express').Router();
const { wrapAll } = require('../middleware/asyncHandler');
const c = wrapAll(require('../controllers/restaurantController'));
const reviews = wrapAll(require('../controllers/reviewController'));
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', c.getAll);
router.get('/mine', protect, authorize('restaurateur'), c.getMine);
router.get('/admin/all', protect, authorize('admin'), c.getAllAdmin);
router.get('/:id', c.getById);
router.get('/:id/reviews', reviews.list);
router.post('/:id/reviews', protect, authorize('client'), reviews.create);
router.post('/', protect, authorize('admin'), c.create);
router.put('/:id', protect, c.update); // owner or admin checked in controller
router.delete('/:id', protect, authorize('admin'), c.remove);
router.put('/:id/validation', protect, authorize('admin'), c.setValidation);

module.exports = router;
