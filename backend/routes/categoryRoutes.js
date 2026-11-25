const router = require('express').Router();
const { wrapAll } = require('../middleware/asyncHandler');
const c = wrapAll(require('../controllers/categoryController'));
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', c.getAll);
router.post('/', protect, c.create);
router.put('/:id', protect, c.update);
router.delete('/:id', protect, c.remove);

module.exports = router;
