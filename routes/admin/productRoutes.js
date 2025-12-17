const express = require('express');
const router = express.Router();
const productController = require('../../controllers/admin/productController');
const auth = require('../../middleware/adminAuth');
const multer = require('../../middleware/multer');

router.get('/products', auth.isLogin, productController.loadProducts);
router.get('/addProduct', auth.isLogin, productController.loadAddProduct);
router.post('/addProduct', auth.isLogin, multer.upload.array('productImage', 3), productController.addProduct);
router.get('/updateProduct', auth.isLogin, productController.loadUpdateProduct);
router.post('/updateProduct', auth.isLogin, multer.updateImage, productController.updateProduct);

module.exports = router;
