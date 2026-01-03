const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/admin/couponController');
const auth = require('../../middleware/adminAuth');

router.get('/coupons', auth.isLogin, couponController.loadCoupons);
router.post('/coupon/add', auth.isLogin, couponController.addCoupon);
router.put('/coupon/update', auth.isLogin, couponController.updateCoupon);
router.delete('/coupon/delete', auth.isLogin, couponController.deleteCoupon);

module.exports = router;
