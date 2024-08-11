const mongoose = require("mongoose");
const paymentTypeSchema = new mongoose.Schema({
    pay_type:{
        type:String,
        required:true
    }

});
module.exports = mongoose.model('PaymentType', paymentTypeSchema);