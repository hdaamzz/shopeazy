const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/user/home/homeController');
const auth = require('../../middleware/userAuth');

router.get('/', auth.isLogout, homeController.loadMain);
router.get('/home', auth.isLogin, homeController.checkGoogleAuthStatus, homeController.loadUserMain);

module.exports = router;
