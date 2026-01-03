const express = require('express');
const user_route = express();
const session = require('express-session');
const passport = require('../controllers/user/googlePassport');
const routes = [
  require('./user/homeRoutes'),
  require('./user/authRoutes'),
  require('./user/productRoutes'),
  require('./user/profileRoutes'),
  require('./user/cartRoutes'),
  require('./user/checkoutRoutes'),
  require('./user/orderRoutes'),
  require('./user/googleRoutes')
];
const { commonMiddleware } = require('../middleware/commonMiddleware');


user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');
commonMiddleware(user_route);
user_route.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    rolling: false,
    saveUninitialized: true
  })
);
user_route.use(passport.initialize());
user_route.use(passport.session());

routes.forEach(route => user_route.use('/', route));


module.exports = user_route;
