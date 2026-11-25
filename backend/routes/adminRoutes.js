const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/users', protect, authorize('admin'), adminController.listUsers);
router.put('/users/:id/status', protect, authorize('admin'), adminController.setUserStatus);
router.put('/users/:id/role', protect, authorize('admin'), adminController.setUserRole);
router.get('/stats', protect, authorize('admin'), adminController.getStats);

module.exports = router;