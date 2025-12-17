const express = require('express');
const router = express.Router();
const signupController = require('../../controllers/user/auth/signupController');
const loginController = require('../../controllers/user/auth/loginController');
const logoutController = require('../../controllers/user/auth/logoutController');
const auth = require('../../middleware/userAuth');

router.post('/signup', signupController.registerUser);
router.post('/loginsignup', signupController.registerUser);
router.get('/otpValidate', auth.isLogout, signupController.loadOtp);
router.post('/otpValidate', signupController.verifyOtp);
router.post('/resendOtp', signupController.resendOtp);
router.get('/auth/google', auth.isLogout, signupController.googleAuth);
router.get('/auth/google/callback', auth.isLogout, signupController.googleAuthCallback);

router.get('/login', loginController.loadLogin);
router.post('/loginsignin', loginController.verifyLogin);
router.post('/signin', loginController.verifyLogin);
router.get('/forgotPassword', loginController.loadForgotPassword);
router.post('/forgotPassword', loginController.forgotPassword);
router.get('/reset-password', loginController.loadResetPassword);
router.post('/reset-password', loginController.resetPassword);

router.get('/logout', auth.isLogin, logoutController.userLogout);

module.exports = router;
