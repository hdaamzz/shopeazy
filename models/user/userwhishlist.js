const mongoose = require("mongoose");
const wishlistSchema = new mongoose.Schema({

    
   user_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
   },product_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
   }
       
    
});
module.exports = mongoose.model('Wishlist', wishlistSchema);