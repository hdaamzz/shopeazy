const express = require("express");
const admin_route = express();
const bodyParser = require("body-parser");
const adminAuthController = require("../controllers/admin/adminAuthController");
const adminDashboardController = require("../controllers/admin/adminDashboardController");
const customersController = require("../controllers/admin/customersController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController");
const adminOrderController = require("../controllers/admin/adminOrderController");
const adminReturnController = require("../controllers/admin/adminReturnController");
const offerController = require('../controllers/admin/offerController');
const couponController = require('../controllers/admin/couponController');
const salesController = require('../controllers/admin/salesController');

const session = require("express-session");
const auth = require('../middleware/adminAuth')
const multer = require('../middleware/multer')
const nocache = require('nocache')


admin_route.use(session({
    secret: process.env.SESSION_SECRET,
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
admin_route.get('/', auth.isLogout, adminAuthController.loadLogin);
admin_route.post('/', adminAuthController.verifyAdmin);
admin_route.get('/adminHome', auth.isLogin, adminDashboardController.loadDashboard);


//customers
admin_route.get('/allCustomers', auth.isLogin, customersController.loadAllCustomers);
admin_route.post('/api/users/block/:userId',auth.isLogin, customersController.toggleUserBlockStatus);


//category
admin_route.get('/category', auth.isLogin, categoryController.loadCategory);
admin_route.post('/category',auth.isLogin, categoryController.addCategory);
admin_route.post('/api/category/list/:categoryId',auth.isLogin, categoryController.toggleCategoryStatus);
admin_route.get('/updateCate',auth.isLogin,categoryController.loadUpdateCategory)
admin_route.post('/updateCate',auth.isLogin,categoryController.updateCategory)

//product
admin_route.get('/products', auth.isLogin, productController.loadProducts)
admin_route.get('/addProduct', auth.isLogin, productController.loadAddProduct)
admin_route.post('/addProduct',auth.isLogin, multer.upload.array('productImage', 3), productController.addProduct);
admin_route.get('/updateProduct', auth.isLogin, productController.loadUpdateProduct)
admin_route.post('/updateProduct',auth.isLogin, multer.updateImage, productController.updateProduct);


//order
admin_route.get('/orders',auth.isLogin,adminOrderController.loadOrderList)
admin_route.get('/updateStatus',auth.isLogin,adminOrderController.loadUpdateStatus)
admin_route.post('/updateStatus',auth.isLogin,adminOrderController.updateStatus);
admin_route.post('/cancelOrder',auth.isLogin,adminOrderController.cancelOrder)


//return
admin_route.get('/returnRequests',auth.isLogin,adminReturnController.loadReturnRequests)
admin_route.post('/updateReturnRequest',auth.isLogin,adminReturnController.updateReturnRequest)


//offer
admin_route.get('/offers',auth.isLogin,offerController.loadProductOffers);
admin_route.post('/offers/addOffers',auth.isLogin,offerController.addOffer)
admin_route.get('/offers/category',auth.isLogin,offerController.loadCategoryOffers)
admin_route.post('/updateOffer',auth.isLogin,offerController.updateOffer);
admin_route.post('/deleteOffer',auth.isLogin,offerController.deleteOffer);

//coupon
admin_route.get('/coupons',auth.isLogin,couponController.loadCoupons);
admin_route.post('/coupons/addCoupon',auth.isLogin,couponController.addCoupon);
admin_route.post('/updateCoupon',auth.isLogin,couponController.updateCoupon);
admin_route.post('/deleteCoupon',auth.isLogin,couponController.deleteCoupon);


//salesreport
admin_route.get('/salesreport',auth.isLogin,salesController.loadSales)
admin_route.get('/salesreport/pdf',auth.isLogin, salesController.downloadPDF);
admin_route.get('/salesreport/excel',auth.isLogin, salesController.downloadExcel);


//logout 
admin_route.get('/logout', adminAuthController.logout)




module.exports = admin_route;