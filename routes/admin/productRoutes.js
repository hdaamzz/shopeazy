const express = require('express');
const router = express.Router();
const productController = require('../../controllers/admin/productController');
const auth = require('../../middleware/adminAuth');
const multer = require('../../middleware/multer');

router.get('/products', auth.isLogin, productController.loadProducts);
router.get('/products/add', auth.isLogin, productController.loadAddProduct);
router.post('/products/add', auth.isLogin, multer.upload.array('productImage', 3), productController.addProduct);
router.get('/products/update', auth.isLogin, productController.loadUpdateProduct);
router.put('/products/update', auth.isLogin, multer.updateImage, productController.updateProduct);

module.exports = router;
