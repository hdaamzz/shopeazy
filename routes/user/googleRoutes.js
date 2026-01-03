const express = require('express');
const router = express.Router();
const signupController = require('../../controllers/user/auth/signupController');
const auth = require('../../middleware/userAuth');


router.get('/auth/google', auth.isLogout, signupController.googleAuth);
router.get('/auth/google/callback', auth.isLogout, signupController.googleAuthCallback);

module.exports = router;