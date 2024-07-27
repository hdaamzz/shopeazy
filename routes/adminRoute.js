const express = require("express");
const admin_route = express();
const config = require("../config/config");
const bodyParser = require("body-parser");
const path = require('path')
const adminController = require("../controllers/admin/adminController");
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
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');






admin_route.get('/',auth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyAdmin);
admin_route.get('/adminHome',auth.isLogin,adminController.loadDashboard);
admin_route.get('/allCustomers',auth.isLogin,adminController.loadAllCustomers);
admin_route.post('/api/users/block/:userId',adminController.blockUser);
admin_route.get('/category',auth.isLogin,adminController.loadCategory);
admin_route.post('/category',adminController.addCategory);
admin_route.post('/api/category/list/:categoryId',adminController.listCategory);
admin_route.post('/updateCategory',adminController.updateCategory);
admin_route.get('/products',auth.isLogin,adminController.loadProducts)
admin_route.get('/addProduct',auth.isLogin,adminController.loadAddProduct)
admin_route.post('/addProduct', multer.upload.array('productImage', 3), adminController.addProduct);
admin_route.get('/updateProduct',auth.isLogin,adminController.loadUpdateProduct)
admin_route.post('/updateProduct', multer.updateImage, adminController.updateProduct);
admin_route.get('/logout',adminController.logout)




module.exports = admin_route;