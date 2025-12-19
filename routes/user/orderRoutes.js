const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/user/checkout/orderController');
const paymentController = require('../../controllers/user/checkout/paymentController');
const orderManagementController = require('../../controllers/user/order/orderManagementController');
const invoiceController = require('../../controllers/user/order/invoiceController');
const repaymentController = require('../../controllers/user/order/repaymentController');
const auth = require('../../middleware/userAuth');

router.post('/placeOrder', auth.isLogin, orderController.placeOrder);
router.patch('/updateOrderStatus/:orderId', auth.isLogin, orderController.updateOrderStatus);
router.get('/orderSummary', auth.isLogin, orderController.loadOrderSummary);

router.post('/verifyPayment', auth.isLogin, paymentController.verifyPayment);
router.post('/payment-failed', auth.isLogin, paymentController.handlePaymentFailure);

router.post('/cancelOrder', auth.isLogin, orderManagementController.cancelOrder);
router.post('/returnOrder', auth.isLogin, orderManagementController.returnOrder);

router.get('/downloadInvoice', auth.isLogin, invoiceController.downloadInvoice);

router.post('/initiate-repayment', auth.isLogin, repaymentController.initiateRepayment);

module.exports = router;
