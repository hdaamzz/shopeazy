const express = require('express');
const router = express.Router();
const checkoutController = require('../../controllers/user/checkout/checkoutController');
const auth = require('../../middleware/userAuth');

router.get('/checkout', auth.isLogin, checkoutController.loadCheckout);
router.post('/checkout/coupon/apply', auth.isLogin, checkoutController.applyCoupon);
router.patch('/checkout/coupon/remove', auth.isLogin, checkoutController.removeCoupon);

module.exports = router;
