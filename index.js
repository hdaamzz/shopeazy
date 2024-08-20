const express = require("express");
const app = express();
require('dotenv').config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI).then(()=>{
    console.log("mongodb connencted");
}).catch((error)=>{
    console.log(error);
})
const path = require('path');
const config = require("./config/config");
const session = require('express-session');
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');
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
app.set('view engine','ejs');
app.set('views', './views/user');
app.set('views', './views/admin');
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', userRoute);
app.use('/admin', adminRoute);

app.use((req,res,next)=>{
    if(req.originalUrl.startsWith('/admin')){
        res.status(500).render('admin404')
    }else{
        res.status(500).render('404');
    }
    
});

 

app.listen(3000, () => {
    console.log(`http://localhost:3000`);
})