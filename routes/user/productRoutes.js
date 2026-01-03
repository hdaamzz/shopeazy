const express = require('express');
const router = express.Router();
const productController = require('../../controllers/user/product/productController');
const searchFilterController = require('../../controllers/user/product/searchFilterController');

router.get('/shop', productController.loadShop);
router.get('/shop/product/categories', productController.loadProductCategory);
router.get('/shop/product', productController.loadShowProduct);

router.get('/shop/product/search', searchFilterController.searchResults);
router.get('/shop/search', searchFilterController.shopFilter);

module.exports = router;
