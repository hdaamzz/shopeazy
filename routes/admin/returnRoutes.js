const express = require('express');
const router = express.Router();
const adminReturnController = require('../../controllers/admin/adminReturnController');
const auth = require('../../middleware/adminAuth');

router.get('/returnRequests', auth.isLogin, adminReturnController.loadReturnRequests);
router.patch('/updateReturnRequest', auth.isLogin, adminReturnController.updateReturnRequest);

module.exports = router;
