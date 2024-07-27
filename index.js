const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/shopeazy")
const express = require("express");
const app = express();
require('dotenv').config();
const path = require('path');
const config = require("./config/config");
const session = require('express-session');
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute')
const passport = require('./controllers/user/googlePassport');


app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/dashboard-assets', express.static(path.join(__dirname, './public/dashboard-assets')));
app.use('/lib', express.static(path.join(__dirname, 'public/lib')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
}));


app.use(passport.initialize());
app.use(passport.session());

app.use('/', userRoute);
app.use('/admin', adminRoute);



app.listen(3000, () => {
    console.log(`http://localhost:3000`);
})