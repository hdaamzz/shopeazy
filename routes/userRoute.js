const express = require('express')
const user_route = express();
const bodyparser = require('body-parser');
const session = require('express-session');
const config = require("../config/config");
const logoutController = require("../controllers/user/logoutController");
const homeController = require('../controllers/user/homeController');
const signupController = require('../controllers/user/signupController');
const loginController = require('../controllers/user/loginController');
const productController = require('../controllers/user/productController');
const dashboardController = require('../controllers/user/dashboardController');
const cartController = require('../controllers/user/cartController');
const searchFilterController = require('../controllers/user/searchFilterController');
const checkoutController = require('../controllers/user/checkoutController');
const walletController =require("../controllers/user/walletController");
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
user_route.get('/', auth.isLogout, homeController.loadMain);
user_route.get('/home', auth.isLogin, homeController.checkGoogleAuthStatus, homeController.loadUserMain);


// sign up
user_route.post('/signup', signupController.registerUser);
user_route.post('/loginsignup',signupController.registerUser);
user_route.get('/otpValidate', auth.isLogout, signupController.loadOtp);
user_route.post('/otpValidate', signupController.verifyOtp);
user_route.post('/resendOtp', signupController.resendOtp);
user_route.get('/auth/google', auth.isLogout, signupController.googleAuth);
user_route.get('/auth/google/callback', auth.isLogout, signupController.googleAuthCallback);

//login 
user_route.get('/login',loginController.loadLogin)
user_route.post('/loginsignin', loginController.verifyLogin);
user_route.post('/signin', loginController.verifyLogin)
user_route.get('/forgotPassword',loginController.loadForgotPassword);
user_route.post('/forgotPassword',loginController.forgotPassword)
user_route.get('/reset-password',loginController.loadResetPassword);
user_route.post('/reset-password',loginController.resetPassword)

//product sections
user_route.get('/shop',productController.loadShop)
user_route.get('/productCategories', productController.loadProductCategory);
user_route.get('/showProduct', productController.loadShowProduct)


//user dashboard
user_route.get('/dashboard',auth.isLogin,dashboardController.loadDashboard)
user_route.post('/addAddress', auth.isLogin,dashboardController.addUserAddress)
user_route.post('/updateAddress', auth.isLogin,dashboardController.updateUserAddress);
user_route.post('/deleteAddress', auth.isLogin,dashboardController.deleteAddress);
user_route.post('/updateUser', auth.isLogin,dashboardController.updateUserData);
user_route.post('/cancelOrder', auth.isLogin,dashboardController.cancelOrder);
user_route.post('/returnOrder', auth.isLogin,dashboardController.returnOrder);
user_route.get('/downloadInvoice', auth.isLogin,dashboardController.downloadInvoice);
user_route.post('/initiate-repayment', auth.isLogin,dashboardController.initiateRepayment)
        

//cart management
user_route.get('/cart' ,auth.isLogin,cartController.loadCart);
user_route.get('/nonUserCart',auth.isLogout,cartController.loaduserCart);
user_route.post('/addCartItem', auth.isLogin,cartController.addCartItem);
user_route.post('/wishlistToCart', auth.isLogin,cartController.wishlistToCart)

user_route.post('/update-cart-quantity', auth.isLogin,cartController.updateCartQuantity)
user_route.post('/remove-from-cart', auth.isLogin, cartController.removeCartItem);
user_route.get('/wishlist', auth.isLogin,cartController.loadWishlist)
user_route.post('/addWishlistItem', auth.isLogin,cartController.addWishlistItem)
user_route.post('/remove-from-wishlist', auth.isLogin, cartController.removeWishlistItem);



//search&filters
user_route.get('/search-results', searchFilterController.searchResults);


user_route.get('/serch',searchFilterController.shopFilter)



//check out section
user_route.get('/checkout',auth.isLogin,checkoutController.loadCheckout)
user_route.post('/placeOrder', auth.isLogin, checkoutController.placeOrder);
user_route.post('/updateOrderStatus/:orderId', auth.isLogin,checkoutController.updateOrderStatus);
user_route.post('/verifyPayment', auth.isLogin,checkoutController.verifyPayment);
user_route.post('/payment-failed', auth.isLogin, checkoutController.paymentFailure)
user_route.get('/orderSummary', auth.isLogin,auth.isLogin, checkoutController.loadOrderSummary);
user_route.post('/applyCoupon', auth.isLogin,checkoutController.applyCoupon)
user_route.post('/removeCoupon', auth.isLogin,checkoutController.removeCoupon)


//wallet 

user_route.get('/wallet',auth.isLogin,walletController.loadWallet);


// logout 
user_route.get('/logout', auth.isLogin, logoutController.userLogout);




module.exports = user_route;


