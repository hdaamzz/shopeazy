const express = require('express');
const router = express.Router();
const signupController = require('../../controllers/user/auth/signupController');
const loginController = require('../../controllers/user/auth/loginController');
const logoutController = require('../../controllers/user/auth/logoutController');
const auth = require('../../middleware/userAuth');

router.get('/login',auth.isLogout, loginController.loadLogin);
router.get('/otpvalidate', auth.isLogout, signupController.loadOtp);
router.post('/signup',auth.isLogout, signupController.registerUser);
router.post('/signin',auth.isLogout, loginController.verifyLogin);
router.post('/otpvalidate', auth.isLogout,signupController.verifyOtp);
router.post('/resendotp', auth.isLogout,signupController.resendOtp);
router.get('/forgot-password', auth.isLogout,loginController.loadForgotPassword);
router.post('/forgot-password',auth.isLogout, loginController.forgotPassword);
router.get('/reset-password', auth.isLogout,loginController.loadResetPassword);
router.post('/reset-password', auth.isLogout,loginController.resetPassword);
router.get('/logout', auth.isLogin, logoutController.userLogout);

module.exports = router;
