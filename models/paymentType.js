const mongoose = require("mongoose");
const paymentTypeSchema = new mongoose.Schema({
    type:{
        type:String,
        required:true
    }

});
module.exports = mongoose.model('PaymentType', paymentTypeSchema);