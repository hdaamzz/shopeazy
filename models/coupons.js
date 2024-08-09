const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    couponId:{
        type:String,
        required:true
    },discount:{
        type:Number,
        required:true
    },description:{
        type:String,
        required:true
    },expiryDate:{
        type:String,
        required:true
    },min_purchase_amount:{
        type:Number,
        required:true
    },max_amount:{
        type:Number,

    },used_users:[
        {type:String}
    ],is_active:{
        type:Boolean,
        default:true
    }
});

module.exports = mongoose.model('Coupon', couponSchema);
