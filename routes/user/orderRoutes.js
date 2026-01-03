const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/user/checkout/orderController');
const paymentController = require('../../controllers/user/checkout/paymentController');
const orderManagementController = require('../../controllers/user/order/orderManagementController');
const invoiceController = require('../../controllers/user/order/invoiceController');
const repaymentController = require('../../controllers/user/order/repaymentController');
const auth = require('../../middleware/userAuth');

router.post('/order/place', auth.isLogin, orderController.placeOrder);
router.patch('/order/status/update/:oderId', auth.isLogin, orderController.updateOrderStatus);
router.get('/order/summary', auth.isLogin, orderController.loadOrderSummary);

router.post('/order/payment/verify', auth.isLogin, paymentController.verifyPayment);
router.post('/order/payment/failed', auth.isLogin, paymentController.handlePaymentFailure);

router.post('/order/cancel', auth.isLogin, orderManagementController.cancelOrder);
router.post('/order/return', auth.isLogin, orderManagementController.returnOrder);

router.get('/order/invoice', auth.isLogin, invoiceController.downloadInvoice);

router.post('/order/payment/repay', auth.isLogin, repaymentController.initiateRepayment);

module.exports = router;
