const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', required: true
    }, user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    admin_response: String,

    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at:
    {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);