const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/admin/categoryController');
const auth = require('../../middleware/adminAuth');

router.get('/category', auth.isLogin, categoryController.loadCategory);
router.post('/category', auth.isLogin, categoryController.addCategory);
router.get('/category/update', auth.isLogin, categoryController.loadUpdateCategory);
router.put('/category/update', auth.isLogin, categoryController.updateCategory);

module.exports = router;
