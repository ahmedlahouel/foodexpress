const router = require('express').Router();
const { wrapAll } = require('../middleware/asyncHandler');
const c = wrapAll(require('../controllers/orderController'));
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('client'), c.create);
router.get('/my-orders', protect, authorize('client'), c.myOrders);
router.get('/restaurant', protect, authorize('restaurateur'), c.restaurantOrders);
router.get('/restaurant/stats', protect, authorize('restaurateur'), c.restaurantStats);
router.put('/:id/status', protect, authorize('restaurateur'), c.updateStatus);

module.exports = router;
