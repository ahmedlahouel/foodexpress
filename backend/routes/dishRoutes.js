const router = require('express').Router();
const { wrapAll } = require('../middleware/asyncHandler');
const c = wrapAll(require('../controllers/dishController'));
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', protect, authorize('restaurateur'), c.create);
router.put('/:id', protect, authorize('restaurateur'), c.update);
router.delete('/:id', protect, authorize('restaurateur'), c.remove);

module.exports = router;
