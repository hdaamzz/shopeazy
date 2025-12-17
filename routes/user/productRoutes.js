const express = require('express');
const router = express.Router();
const productController = require('../../controllers/user/product/productController');
const searchFilterController = require('../../controllers/user/product/searchFilterController');

router.get('/shop', productController.loadShop);
router.get('/productCategories', productController.loadProductCategory);
router.get('/showProduct', productController.loadShowProduct);

router.get('/search-results', searchFilterController.searchResults);
router.get('/serch', searchFilterController.shopFilter);

module.exports = router;
