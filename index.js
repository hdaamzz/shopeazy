const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/shopeazy")
const express = require("express");
const app = express();
const path = require('path');
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');


app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/lib', express.static(path.join(__dirname, 'public/lib')));



app.use('/',userRoute);
app.use('/admin', adminRoute);



app.listen(3000, () => {
    console.log(`http://localhost:3000`);
})