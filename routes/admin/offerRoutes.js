const express = require('express');
const router = express.Router();
const offerController = require('../../controllers/admin/offerController');
const auth = require('../../middleware/adminAuth');

router.get('/offers', auth.isLogin, offerController.loadProductOffers);
router.post('/offers/add', auth.isLogin, offerController.addOffer);
router.get('/offers/category', auth.isLogin, offerController.loadCategoryOffers);
router.put('/offers/update', auth.isLogin, offerController.updateOffer);
router.delete('/offers/delete', auth.isLogin, offerController.deleteOffer);

module.exports = router;
