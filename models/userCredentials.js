const mongoose = require("mongoose");
const userCrendtialsSchema = new mongoose.Schema({
    
    email_address: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    is_valid: {
        type: Boolean,
        required: true
    },
    is_block:{
        type:Boolean,
        required:true
    },
    user_name: {
        type:String,
        required:true
    }
});
module.exports = mongoose.model('Users', userCrendtialsSchema);