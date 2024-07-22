const express = require('express')
const user_route = express();
const bodyparser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const config = require("../config/config");
const userController = require("../controllers/userController");
const auth =require("../middleware/userAuth")




user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');
user_route.use(bodyparser.json())
user_route.use(bodyparser.urlencoded({ extended: true }))
user_route.use(session({
    secret: config.sessionSecret,
    // cookie:{maxAge:5000},
    resave: false,
    rolling:false,
    saveUninitialized: true,

}));
user_route.get('/',auth.isLogout,userController.loadMain);
user_route.post('/signup',userController.registerUser);
user_route.get('/otpValidate',auth.isLogout,userController.loadOtp);
user_route.post('/otpValidate',userController.verifyOtp);
user_route.post('/resendOtp', userController.resendOtp);
user_route.get('/home', auth.isLogin, userController.checkGoogleAuthStatus, userController.loadUserMain);
user_route.get('/auth/google', userController.googleAuth);
user_route.get('/auth/google/callback', userController.googleAuthCallback);
user_route.post('/signin',userController.verifyLogin)
user_route.post('/check-email',userController.checkMail);







user_route.get('/logout', userController.userLogout);










module.exports = user_route;