const mongoose = require("mongoose");
const userCrendtialsSchema = new mongoose.Schema({
    
    email_address: {
        type: String,
        required: function() { return !this.googleId; }
    },
    googleId: {
        type: String,
        sparse: true 
    },
    password: {
        type: String,
        required: function() { return !this.googleId; }
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
        required: function() { return !this.googleId; }
    }
});
module.exports = mongoose.model('Users', userCrendtialsSchema);