const mongoose = require("mongoose");

const userOrdersSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },order_id:{
        type:String
    },
    address_id: {
        name:{
            type:String,
            required:true
        },phone_number:{
            type:String,
            required:true
        },pin_code:{
            type:Number,
            required:true
        },town_city:{
            type:String,
            required:true
        },address:{
            type:String,
            required:true
        },landmark:{
            type:String
        },state:{
            type:String,
            required:true
        }
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },status: {
            type: String,
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled','Return Requested','Returned','Rejected'],
            default: 'Pending'
        },
        cancellation_reason:{
            type:String
        },
        price: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }],
    total_amount: {
        type: Number,
        required: true
    },
    payment_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentType',
        required: true
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed','Processing'],
        default: 'Pending'
    },

    // order_status: {
    //     type: String,
    //     enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled','Return Requested','Returned','Rejected'],
    //     default: 'Pending'
    // }
    cancellation_reason:{
        type:String
    },
    shipping_cost: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    },razorpay_order_id: {
        type: String
    },razorpay_payment_id: {
        type: String
    },razorpay_signature: {
        type: String
    }
    
    
});

module.exports = mongoose.model('Order', userOrdersSchema);
