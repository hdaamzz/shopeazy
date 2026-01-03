const express = require('express');
const admin_route = express();
const session = require('express-session');
const routes = [
  require('./admin/authRoutes'),
  require('./admin/dashboardRoutes'),
  require('./admin/customerRoutes'),
  require('./admin/categoryRoutes'),
  require('./admin/productRoutes'),
  require('./admin/orderRoutes'),
  require('./admin/returnRoutes'),
  require('./admin/offerRoutes'),
  require('./admin/couponRoutes'),
  require('./admin/salesRoutes')
];
const { commonMiddleware } = require('../middleware/commonMiddleware');



admin_route.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  })
);
commonMiddleware(admin_route);

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');


routes.forEach(route => admin_route.use('/', route));

module.exports = admin_route;
