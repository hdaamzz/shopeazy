const express = require('express');
const router = express.Router();
const checkoutController = require('../../controllers/user/checkout/checkoutController');
const auth = require('../../middleware/userAuth');

router.get('/checkout', auth.isLogin, checkoutController.loadCheckout);
router.post('/applyCoupon', auth.isLogin, checkoutController.applyCoupon);
router.patch('/removeCoupon', auth.isLogin, checkoutController.removeCoupon);

module.exports = router;
