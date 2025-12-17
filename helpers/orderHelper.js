const Product = require('../models/admin/products');

const updateProductStock = async (cartItems) => {
  for (let item of cartItems) {
    await Product.findByIdAndUpdate(
      item.product_id._id,
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
  }
};

module.exports = {
  updateProductStock
};
