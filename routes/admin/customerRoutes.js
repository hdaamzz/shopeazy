const express = require('express');
const router = express.Router();
const customersController = require('../../controllers/admin/customersController');
const auth = require('../../middleware/adminAuth');

router.get('/allCustomers', auth.isLogin, customersController.loadAllCustomers);
router.patch('/api/users/block/:userId', auth.isLogin, customersController.toggleUserBlockStatus);

module.exports = router;
