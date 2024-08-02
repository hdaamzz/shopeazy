const mongoose = require("mongoose");

const userOrdersSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    address_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
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
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    order_status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },cancellation_reason:{
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
    }
});

module.exports = mongoose.model('Order', userOrdersSchema);
