const express = require('express');
const router = express.Router();
const signupController = require('../../controllers/user/auth/signupController');
const loginController = require('../../controllers/user/auth/loginController');
const logoutController = require('../../controllers/user/auth/logoutController');
const auth = require('../../middleware/userAuth');

router.get('/auth/login',auth.isLogout, loginController.loadLogin);
router.post('/auth/login',auth.isLogout, loginController.verifyLogin);
router.post('/auth/register',auth.isLogout, signupController.registerUser);
router.get('/auth/register/otp', auth.isLogout, signupController.loadOtp);
router.post('/auth/register/otp', auth.isLogout,signupController.verifyOtp);
router.post('/auth/register/otp/resend', auth.isLogout,signupController.resendOtp);

router.get('/auth/password/forgot', auth.isLogout,loginController.loadForgotPassword);
router.post('/auth/password/forgot',auth.isLogout, loginController.forgotPassword);
router.get('/auth/password/reset', auth.isLogout,loginController.loadResetPassword);
router.post('/auth/password/reset', auth.isLogout,loginController.resetPassword);
router.get('/auth/logout', auth.isLogin, logoutController.userLogout);

module.exports = router;
