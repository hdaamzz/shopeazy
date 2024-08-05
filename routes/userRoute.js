const express = require('express')
const user_route = express();
const bodyparser = require('body-parser');
const session = require('express-session');
const config = require("../config/config");
const userController = require("../controllers/user/userController");
const auth = require("../middleware/userAuth")
const nocache = require('nocache')




user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');
user_route.use(nocache())
user_route.use(bodyparser.json())
user_route.use(bodyparser.urlencoded({ extended: true }))
user_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    rolling: false,
    saveUninitialized: true,

}));

// home page 
user_route.get('/', auth.isLogout, userController.loadMain);
user_route.get('/home', auth.isLogin, userController.checkGoogleAuthStatus, userController.loadUserMain);


// sign up
user_route.post('/signup', userController.registerUser);
user_route.get('/otpValidate', auth.isLogout, userController.loadOtp);
user_route.post('/otpValidate', userController.verifyOtp);
user_route.post('/resendOtp', userController.resendOtp);
user_route.get('/auth/google', auth.isLogout, userController.googleAuth);
user_route.get('/auth/google/callback', auth.isLogout, userController.googleAuthCallback);

//login 
user_route.post('/signin', userController.verifyLogin)

//product sections
user_route.get('/shop',userController.loadShop)
user_route.get('/productCategories', userController.loadProductCategory);
user_route.get('/showProduct', userController.loadShowProduct)


//user dashboard
user_route.get('/dashboard',auth.isLogin,userController.loadDashboard)
user_route.post('/addAddress',userController.addUserAddress)
user_route.post('/updateAddress',userController.updateUserAddress);
user_route.post('/deleteAddress',userController.deleteAddress);
user_route.post('/updateUser',userController.updateUserData);
user_route.post('/cancelOrder',userController.cancelOrder)


//cart management
user_route.get('/cart' ,auth.isLogin,userController.loadCart);
user_route.get('/nonUserCart',auth.isLogout,userController.loaduserCart);
user_route.post('/addCartItem',userController.addCartItem)
user_route.post('/update-cart-quantity',userController.updateCartQuantity)
user_route.post('/remove-from-cart', userController.removeCartItem);


//search&filters
user_route.get('/search-results', userController.searchResults);
user_route.get('/serch',userController.shopFilter)

//check out section
user_route.get('/checkout',auth.isLogin,userController.loadCheckout)
user_route.post('/placeOrder', userController.placeOrder);
user_route.get('/orderSummary',auth.isLogin, userController.loadOrderSummary);


// logout 
user_route.get('/logout', auth.isLogin, userController.userLogout);


module.exports = user_route;


