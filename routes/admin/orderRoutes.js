const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/admin/adminOrderController');
const auth = require('../../middleware/adminAuth');

router.get('/orders', auth.isLogin, adminOrderController.loadOrderList);
router.get('/updateStatus', auth.isLogin, adminOrderController.loadUpdateStatus);
router.post('/updateStatus', auth.isLogin, adminOrderController.updateStatus);
router.post('/cancelOrder', auth.isLogin, adminOrderController.cancelOrder);

module.exports = router;
