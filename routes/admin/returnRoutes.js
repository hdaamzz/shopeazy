const express = require('express');
const router = express.Router();
const adminReturnController = require('../../controllers/admin/adminReturnController');
const auth = require('../../middleware/adminAuth');

router.get('/order/return/request', auth.isLogin, adminReturnController.loadReturnRequests);
router.patch('/order/return/request/update', auth.isLogin, adminReturnController.updateReturnRequest);

module.exports = router;
