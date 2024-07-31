const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },product_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: true
    },quantity:{
        type:Number,

    }
});
module.exports = mongoose.model('Cart', cartSchema);