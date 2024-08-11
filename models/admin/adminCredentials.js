const mongoose = require("mongoose");
const adminCrendtialsSchema = new mongoose.Schema({
    
    admin_name:{
        type:String
    },email_address:{
        type:String
    },password:{
        type:String
    },phone_number:{
        type:String
    }
});
module.exports = mongoose.model('Admin', adminCrendtialsSchema);