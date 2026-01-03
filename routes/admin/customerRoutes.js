const express = require('express');
const router = express.Router();
const customersController = require('../../controllers/admin/customersController');
const auth = require('../../middleware/adminAuth');

router.get('/customers', auth.isLogin, customersController.loadAllCustomers);
router.patch('/customers/block/:userId', auth.isLogin, customersController.toggleUserBlockStatus);

module.exports = router;
