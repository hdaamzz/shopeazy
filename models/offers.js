const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true 
  },
  description: {
    type: String,
    required: true
  },
  discount: {
    type: Number,
    required: true 
  },
  type: {
    type: String,
    required: true 
  },
  products: [{
   type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
  category: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, {
  timestamps: true 
});

module.exports = mongoose.model('Offer', offerSchema);
