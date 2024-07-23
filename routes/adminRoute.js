const express = require("express");
const admin_route = express();
const config = require("../config/config");
const bodyParser = require("body-parser");
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

admin_route.get('/',adminController.loadLogin);
admin_route.post('/',adminController.verifyAdmin);
admin_route.get('/adminHome',adminController.loadDashboard);
admin_route.get('/allCustomers',adminController.loadAllCustomers);
admin_route.post('/api/users/block/:userId',adminController.blockUser);




module.exports = admin_route;