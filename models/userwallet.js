const mongoose = require("mongoose");
const walletSchema = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },balance:{
        type:Number

    },history:[{
        amount:{
            type:Number
        },date:{
           type: Date,
        default: Date.now
        },
        transaction_type:{
            type:String
        },description:{
            type:String
        },transaction_id:{
            type:String,
            required:true
        }
    }]
       
    
});
module.exports = mongoose.model('Wallet', walletSchema);