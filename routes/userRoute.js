const express = require('express');
const user_route = express();
const bodyparser = require('body-parser');
const session = require('express-session');
const nocache = require('nocache');
const passport = require('../controllers/user/googlePassport');

const authRoutes = require('./user/authRoutes');
const homeRoutes = require('./user/homeRoutes');
const productRoutes = require('./user/productRoutes');
const profileRoutes = require('./user/profileRoutes');
const cartRoutes = require('./user/cartRoutes');
const checkoutRoutes = require('./user/checkoutRoutes');
const orderRoutes = require('./user/orderRoutes');

user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');
user_route.use(nocache());
user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({ extended: true }));
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

user_route.use('/', homeRoutes);
user_route.use('/', authRoutes);
user_route.use('/', productRoutes);
user_route.use('/', profileRoutes);
user_route.use('/', cartRoutes);
user_route.use('/', checkoutRoutes);
user_route.use('/', orderRoutes);

module.exports = user_route;
