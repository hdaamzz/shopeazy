const express = require('express')
const user_route = express();
const bodyparser = require('body-parser');
const session = require('express-session');
const logoutController = require("../controllers/user/auth/logoutController");
const homeController = require('../controllers/user/home/homeController');
const signupController = require('../controllers/user/auth/signupController');
const loginController = require('../controllers/user/auth/loginController');
const productController = require('../controllers/user/product/productController');
const dashboardController = require('../controllers/user/profile/dashboardController');
const cartController = require('../controllers/user/cart/cartController');
const wishlistController = require('../controllers/user/cart/wishlistController');
const searchFilterController = require('../controllers/user/product/searchFilterController');
const checkoutController = require('../controllers/user/checkout/checkoutController');
const walletController =require("../controllers/user/profile/walletController");
const orderController =require("../controllers/user/checkout/orderController");
const paymentController =require("../controllers/user/checkout/paymentController");
const addressController =require("../controllers/user/profile/addressController");
const invoiceController =require("../controllers/user/order/invoiceController");
const orderManagementController =require("../controllers/user/order/orderManagementController");
const profileController =require("../controllers/user/profile/profileController");
const repaymentController =require("../controllers/user/order/repaymentController");





const auth = require("../middleware/userAuth")
const nocache = require('nocache')




user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');
user_route.use(nocache())
user_route.use(bodyparser.json())
user_route.use(bodyparser.urlencoded({ extended: true }))
user_route.use(session({
    secret: process.env.SESSION_SECRET,
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


user_route.post('/addAddress', auth.isLogin,addressController.addUserAddress)
user_route.post('/updateAddress', auth.isLogin,addressController.updateUserAddress);
user_route.post('/deleteAddress', auth.isLogin,addressController.deleteAddress);


user_route.post('/updateUser', auth.isLogin,profileController.updateUserData);

user_route.post('/cancelOrder', auth.isLogin,orderManagementController.cancelOrder);
user_route.post('/returnOrder', auth.isLogin,orderManagementController.returnOrder);


user_route.get('/downloadInvoice', auth.isLogin,invoiceController.downloadInvoice);

user_route.post('/initiate-repayment', auth.isLogin,repaymentController.initiateRepayment)
        

//cart management
user_route.get('/cart' ,auth.isLogin,cartController.loadCart);
user_route.get('/nonUserCart',auth.isLogout,cartController.loadUserCart);
user_route.post('/addCartItem', auth.isLogin,cartController.addCartItem);
user_route.post('/wishlistToCart', auth.isLogin,cartController.moveWishlistToCart)
user_route.post('/update-cart-quantity', auth.isLogin,cartController.updateCartQuantity)
user_route.post('/remove-from-cart', auth.isLogin, cartController.removeCartItem);


user_route.get('/wishlist', auth.isLogin,wishlistController.loadWishlist)
user_route.post('/addWishlistItem', auth.isLogin,wishlistController.addWishlistItem)
user_route.post('/remove-from-wishlist', auth.isLogin, wishlistController.removeWishlistItem);



//search&filters
user_route.get('/search-results', searchFilterController.searchResults);


user_route.get('/serch',searchFilterController.shopFilter)



//check out section
user_route.get('/checkout',auth.isLogin,checkoutController.loadCheckout)
user_route.post('/applyCoupon', auth.isLogin,checkoutController.applyCoupon)
user_route.post('/removeCoupon', auth.isLogin,checkoutController.removeCoupon)



user_route.post('/placeOrder', auth.isLogin, orderController.placeOrder);
user_route.post('/updateOrderStatus/:orderId', auth.isLogin,orderController.updateOrderStatus);
user_route.get('/orderSummary', auth.isLogin,auth.isLogin, orderController.loadOrderSummary);


user_route.post('/verifyPayment', auth.isLogin,paymentController.verifyPayment);
user_route.post('/payment-failed', auth.isLogin, paymentController.handlePaymentFailure)


//wallet 

user_route.get('/wallet',auth.isLogin,walletController.loadWallet);


// logout 
user_route.get('/logout', auth.isLogin, logoutController.userLogout);




module.exports = user_route;


