const express = require('express');
const router = express.Router();
const adminDashboardController = require('../../controllers/admin/adminDashboardController');
const auth = require('../../middleware/adminAuth');

router.get('/adminHome', auth.isLogin, adminDashboardController.loadDashboard);

module.exports = router;
