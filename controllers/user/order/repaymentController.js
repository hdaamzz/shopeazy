const { HTTP_STATUS } = require('../../../utils/constants');
const Orders = require('../../../models/user/userOrders');
const Razorpay = require('razorpay');
require('dotenv').config();

const PAYMENT_STATUS = {
  FAILED: 'Failed',
  PROCESSING: 'Processing'
};

const RAZORPAY_CURRENCY = 'INR';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async (order, amount) => {
  return await razorpay.orders.create({
    amount: Math.round(parseFloat(amount) * 100),
    currency: RAZORPAY_CURRENCY,
    receipt: order._id.toString(),
    payment_capture: 1
  });
};

const initiateRepayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    const order = await Orders.findById(orderId);

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (
      order.payment_status !== PAYMENT_STATUS.FAILED &&
      order.payment_status !== PAYMENT_STATUS.PROCESSING
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'This order does not require repayment'
      });
    }

    const razorpayOrder = await createRazorpayOrder(order, amount);
    order.razorpay_order_id = razorpayOrder.id;
    await order.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      message: 'Repayment initiated successfully',
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    console.error('Error initiating repayment:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to initiate repayment',
      error: error.message
    });
  }
};

module.exports = {
  initiateRepayment
};
