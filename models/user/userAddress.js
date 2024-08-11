const mongoose =require('mongoose')
const addressSchema = new mongoose.Schema({
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
    },user_id:{
        type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true
    },is_default:{
        type:Boolean,
        required:true
    }

})
module.exports = mongoose.model('Address', addressSchema);