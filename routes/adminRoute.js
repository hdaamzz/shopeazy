const express = require("express");
const admin_route = express();
const config = require("../config/config");
const bodyParser = require("body-parser");
const multer = require('multer');
const path = require('path')
const adminController = require("../controllers/adminController");
const session = require("express-session");
const auth = require('../middleware/adminAuth')

admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true
}));
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/') // Ensure this directory exists
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname))
    }
  });
  const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // Limit file size to 5MB
    fileFilter: function (req, file, cb) {
      checkFileType(file, cb);
    }
  });
  function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
  
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
  const updateImage = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
}).fields([
    { name: 'productImage1', maxCount: 1 },
    { name: 'productImage2', maxCount: 1 },
    { name: 'productImage3', maxCount: 1 }
]);






admin_route.get('/',adminController.loadLogin);
admin_route.post('/',adminController.verifyAdmin);
admin_route.get('/adminHome',adminController.loadDashboard);
admin_route.get('/allCustomers',adminController.loadAllCustomers);
admin_route.post('/api/users/block/:userId',adminController.blockUser);
admin_route.get('/category',adminController.loadCategory);
admin_route.post('/category',adminController.addCategory);
admin_route.post('/api/category/list/:categoryId',adminController.listCategory);
admin_route.post('/updateCategory',adminController.updateCategory);
admin_route.get('/products',adminController.loadProducts)
admin_route.get('/addProduct',adminController.loadAddProduct)
admin_route.post('/addProduct', upload.array('productImage', 3), adminController.addProduct);
admin_route.get('/updateProduct',adminController.loadUpdateProduct)
admin_route.post('/updateProduct', updateImage, adminController.updateProduct);




module.exports = admin_route;