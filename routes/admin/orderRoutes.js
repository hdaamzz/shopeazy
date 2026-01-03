const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/admin/adminOrderController');
const auth = require('../../middleware/adminAuth');

router.get('/orders', auth.isLogin, adminOrderController.loadOrderList);
router.get('/order/status/update', auth.isLogin, adminOrderController.loadUpdateStatus);
router.patch('/order/status/update', auth.isLogin, adminOrderController.updateStatus);
router.patch('/order/cancel', auth.isLogin, adminOrderController.cancelOrder);

module.exports = router;
