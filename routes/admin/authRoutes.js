const express = require('express');
const router = express.Router();
const adminAuthController = require('../../controllers/admin/adminAuthController');
const auth = require('../../middleware/adminAuth');

router.get('/', auth.isLogout, adminAuthController.loadLogin);
router.post('/', adminAuthController.verifyAdmin);
router.get('/auth/logout', adminAuthController.logout);

module.exports = router;
