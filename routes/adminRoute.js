const express = require('express');
const admin_route = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const nocache = require('nocache');

const authRoutes = require('./admin/authRoutes');
const dashboardRoutes = require('./admin/dashboardRoutes');
const customerRoutes = require('./admin/customerRoutes');
const categoryRoutes = require('./admin/categoryRoutes');
const productRoutes = require('./admin/productRoutes');
const orderRoutes = require('./admin/orderRoutes');
const returnRoutes = require('./admin/returnRoutes');
const offerRoutes = require('./admin/offerRoutes');
const couponRoutes = require('./admin/couponRoutes');
const salesRoutes = require('./admin/salesRoutes');

admin_route.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  })
);
admin_route.use(nocache());
admin_route.use(express.json());
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

admin_route.use('/', authRoutes);
admin_route.use('/', dashboardRoutes);
admin_route.use('/', customerRoutes);
admin_route.use('/', categoryRoutes);
admin_route.use('/', productRoutes);
admin_route.use('/', orderRoutes);
admin_route.use('/', returnRoutes);
admin_route.use('/', offerRoutes);
admin_route.use('/', couponRoutes);
admin_route.use('/', salesRoutes);

module.exports = admin_route;
