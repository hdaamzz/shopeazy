const crypto = require('crypto');
const { HTTP_STATUS } = require('../../../utils/constants');
const Cart = require('../../../models/user/cart');
const Product = require('../../../models/admin/products');
const Orders = require('../../../models/user/userOrders');
const { updateProductStock } = require('../../../helpers/orderHelper');
require('dotenv').config();

const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};

const ORDER_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing'
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } =
      req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const updatedOrder = await Orders.findByIdAndUpdate(
        orderId,
        {
          payment_status: PAYMENT_STATUS.COMPLETED,
          'payment_details.razorpay_order_id': razorpay_order_id,
          'payment_details.razorpay_payment_id': razorpay_payment_id,
          'payment_details.razorpay_signature': razorpay_signature
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Order not found'
        });
      }

      await Orders.findByIdAndUpdate(
        orderId,
        { $set: { 'items.$[].status': ORDER_STATUS.PROCESSING } },
        { new: true }
      );

      const cartItems = await Cart.find({ user_id: updatedOrder.user_id }).populate(
        'product_id'
      );
      await updateProductStock(cartItems);
      await Cart.deleteMany({ user_id: updatedOrder.user_id });

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        order: updatedOrder
      });
    }

    await Orders.findByIdAndUpdate(
      orderId,
      { payment_status: PAYMENT_STATUS.FAILED },
      { new: true }
    );

    res.json({
      success: false,
      message: 'Payment verification failed'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Payment verification error',
      error: error.message
    });
  }
};

const handlePaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, orderId } = req.body;

    const updatedOrder = await Orders.findByIdAndUpdate(
      orderId,
      {
        payment_status: PAYMENT_STATUS.FAILED,
        'payment_details.razorpay_order_id': razorpay_order_id
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment failure recorded',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error handling payment failure:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Error recording payment failure',
      error: error.message
    });
  }
};

module.exports = {
  verifyPayment,
  handlePaymentFailure
};
