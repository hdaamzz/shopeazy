const express = require('express');
const router = express.Router();
const offerController = require('../../controllers/admin/offerController');
const auth = require('../../middleware/adminAuth');

router.get('/offers', auth.isLogin, offerController.loadProductOffers);
router.post('/offers/addOffers', auth.isLogin, offerController.addOffer);
router.get('/offers/category', auth.isLogin, offerController.loadCategoryOffers);
router.post('/updateOffer', auth.isLogin, offerController.updateOffer);
router.post('/deleteOffer', auth.isLogin, offerController.deleteOffer);

module.exports = router;
