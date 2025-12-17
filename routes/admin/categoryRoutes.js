const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/admin/categoryController');
const auth = require('../../middleware/adminAuth');

router.get('/category', auth.isLogin, categoryController.loadCategory);
router.post('/category', auth.isLogin, categoryController.addCategory);
router.post('/api/category/list/:categoryId', auth.isLogin, categoryController.toggleCategoryStatus);
router.get('/updateCate', auth.isLogin, categoryController.loadUpdateCategory);
router.post('/updateCate', auth.isLogin, categoryController.updateCategory);

module.exports = router;
