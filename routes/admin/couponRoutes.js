const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/admin/couponController');
const auth = require('../../middleware/adminAuth');

router.get('/coupons', auth.isLogin, couponController.loadCoupons);
router.post('/coupons/addCoupon', auth.isLogin, couponController.addCoupon);
router.put('/updateCoupon', auth.isLogin, couponController.updateCoupon);
router.delete('/deleteCoupon', auth.isLogin, couponController.deleteCoupon);

module.exports = router;
