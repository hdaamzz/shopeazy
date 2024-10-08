const express = require("express");
const admin_route = express();
const config = require("../config/config");
const bodyParser = require("body-parser");
const loginController = require("../controllers/admin/loginController");
const customersController = require("../controllers/admin/customersController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController");
const orderController = require("../controllers/admin/orderController");
const logoutController = require("../controllers/admin/logoutController");
const offerController = require('../controllers/admin/offerController');
const couponController = require('../controllers/admin/couponController');
const salesController = require('../controllers/admin/salesController');

const session = require("express-session");
const auth = require('../middleware/adminAuth')
const multer = require('../middleware/multer')
const nocache = require('nocache')


admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true
}));
admin_route.use(nocache())
admin_route.use(express.json());
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');





//login dashboard
admin_route.get('/', auth.isLogout, loginController.loadLogin);
admin_route.post('/', loginController.verifyAdmin);
admin_route.get('/adminHome', auth.isLogin, loginController.loadDashboard);


//customers
admin_route.get('/allCustomers', auth.isLogin, customersController.loadAllCustomers);
admin_route.post('/api/users/block/:userId',auth.isLogin, customersController.blockUser);


//category
admin_route.get('/category', auth.isLogin, categoryController.loadCategory);
admin_route.post('/category',auth.isLogin, categoryController.addCategory);
admin_route.post('/api/category/list/:categoryId',auth.isLogin, categoryController.listCategory);
admin_route.get('/updateCate',auth.isLogin,categoryController.loadUpdateCategory)
admin_route.post('/updateCate',auth.isLogin,categoryController.updateCategory)

//product
admin_route.get('/products', auth.isLogin, productController.loadProducts)
admin_route.get('/addProduct', auth.isLogin, productController.loadAddProduct)
admin_route.post('/addProduct',auth.isLogin, multer.upload.array('productImage', 3), productController.addProduct);
admin_route.get('/updateProduct', auth.isLogin, productController.loadUpdateProduct)
admin_route.post('/updateProduct',auth.isLogin, multer.updateImage, productController.updateProduct);


//order
admin_route.get('/orders',auth.isLogin,orderController.loadOrderList)
admin_route.get('/updateStatus',auth.isLogin,orderController.loadupdateStatus)
admin_route.post('/updateStatus',auth.isLogin,orderController.updateStatus);
admin_route.post('/cancelOrder',auth.isLogin,orderController.cancelOrder)
admin_route.get('/returnRequests',auth.isLogin,orderController.loadReturnPage)
admin_route.post('/updateReturnRequest',auth.isLogin,orderController.updateReturnRequest)


//offer
admin_route.get('/offers',auth.isLogin,offerController.loadOffer);
admin_route.post('/offers/addOffers',auth.isLogin,offerController.addOffer)
admin_route.get('/offers/category',auth.isLogin,offerController.loadCateOffer)
admin_route.post('/updateOffer',auth.isLogin,offerController.updateOffer);
admin_route.post('/deleteOffer',auth.isLogin,offerController.deleteOffer);

//coupon
admin_route.get('/coupons',auth.isLogin,couponController.loadCoupon);
admin_route.post('/coupons/addCoupon',auth.isLogin,couponController.addCoupon);
admin_route.post('/updateCoupon',auth.isLogin,couponController.updateCoupon);
admin_route.post('/deleteCoupon',auth.isLogin,couponController.deleteCoupon);


//salesreport
admin_route.get('/salesreport',auth.isLogin,salesController.loadSales)
admin_route.get('/salesreport/pdf',auth.isLogin, salesController.downloadPDF);
admin_route.get('/salesreport/excel',auth.isLogin, salesController.downloadExcel);


//logout 
admin_route.get('/logout', logoutController.logout)




module.exports = admin_route;