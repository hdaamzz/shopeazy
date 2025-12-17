const { HTTP_STATUS } = require('../../../utils/constants');
const { validationResult } = require('express-validator');
const Product = require('../../../models/admin/products');
const Address = require('../../../models/user/userAddress');
const Cart = require('../../../models/user/cart');
const PaymentType = require('../../../models/admin/paymentType');
const Orders = require('../../../models/user/userOrders');
const Offer = require('../../../models/admin/offers');
const { updateProductStock } = require('../../../helpers/orderHelper');
const Razorpay = require('razorpay');
require('dotenv').config();

const PAYMENT_TYPES = {
  CASH_ON_DELIVERY: 'CASH ON DELIVERY',
  UPI_PAYMENT: 'UPI PAYMENT'
};

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

const OFFER_TYPES = {
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY'
};

const OFFER_STATUS = {
  ACTIVE: 'active'
};

const COD_LIMIT = 1000;
const RAZORPAY_CURRENCY = 'INR';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const calculateOrderItems = (cartItems, offers, couponPercent) => {
  return cartItems.map((item) => {
    let bestDiscount = 0;
    let discountedPrice = item.product_id.price;

    if (couponPercent > 0) {
      discountedPrice = item.product_id.price * (1 - couponPercent / 100);
    }

    offers.forEach((offer) => {
      if (
        offer.type === OFFER_TYPES.PRODUCT &&
        offer.products.some((product) => String(product._id) === String(item.product_id._id))
      ) {
        bestDiscount = Math.max(bestDiscount, offer.discount);
      } else if (
        offer.type === OFFER_TYPES.CATEGORY &&
        offer.category.some(
          (category) => String(item.product_id.category) === String(category._id)
        )
      ) {
        bestDiscount = Math.max(bestDiscount, offer.discount);
      }
    });

    if (bestDiscount > 0) {
      discountedPrice = item.product_id.price * (1 - bestDiscount / 100);

      if (couponPercent > 0) {
        discountedPrice = discountedPrice * (1 - couponPercent / 100);
      }
    }

    const finalPrice = parseFloat(discountedPrice.toFixed(2));

    return {
      product_id: item.product_id._id,
      name: item.product_id.product_name,
      quantity: item.quantity,
      original_price: item.product_id.price,
      price: finalPrice,
      status: ORDER_STATUS.PENDING,
      total: parseFloat((finalPrice * item.quantity).toFixed(2))
    };
  });
};

const createRazorpayOrder = async (order, total_amount) => {
  return await razorpay.orders.create({
    amount: Math.round(parseFloat(total_amount) * 100),
    currency: RAZORPAY_CURRENCY,
    receipt: order._id.toString(),
    payment_capture: 1
  });
};

const placeOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        errors: errors.array()
      });
    }

    const { address_id, payment_type, total_amount, coupon_discount, couponPercent } =
      req.body;
    const user_id = req.session.user_id;

    const address = await Address.findById(address_id);
    if (!address) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid address'
      });
    }

    const cartItems = await Cart.find({ user_id }).populate('product_id');
    if (cartItems.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const paymentTypeObj = await PaymentType.findOne({ pay_type: payment_type });
    if (!paymentTypeObj) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid payment type'
      });
    }

    if (
      parseFloat(total_amount) > COD_LIMIT &&
      paymentTypeObj.pay_type === PAYMENT_TYPES.CASH_ON_DELIVERY
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Cash on Delivery is not available for orders above ₹${COD_LIMIT}. Please choose a different payment method.`
      });
    }

    const offers = await Offer.find({ status: OFFER_STATUS.ACTIVE })
      .populate('products')
      .populate('category');

    const orderItems = calculateOrderItems(cartItems, offers, couponPercent);

    const randomOrderId = Math.floor(10000 + Math.random() * 90000);
    const newOrder = new Orders({
      user_id,
      order_id: `ORD-${randomOrderId}`,
      address_id: address,
      items: orderItems,
      total_amount: parseFloat(total_amount),
      payment_type: paymentTypeObj._id,
      payment_status:
        paymentTypeObj.pay_type === PAYMENT_TYPES.UPI_PAYMENT
          ? PAYMENT_STATUS.PROCESSING
          : PAYMENT_STATUS.PENDING,
      shipping_cost: 0,
      tax: 0,
      discount: parseFloat(coupon_discount) || 0
    });

    await newOrder.save();

    if (paymentTypeObj.pay_type === PAYMENT_TYPES.UPI_PAYMENT) {
      const razorpayOrder = await createRazorpayOrder(newOrder, total_amount);
      newOrder.razorpay_order_id = razorpayOrder.id;
      await newOrder.save();

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID,
        message: 'Order created successfully',
        orderId: newOrder._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      });
    }

    await updateProductStock(cartItems);
    await Cart.deleteMany({ user_id });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order placed successfully',
      orderId: newOrder._id
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to place order',
      error: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updatedOrder = await Orders.findByIdAndUpdate(
      orderId,
      { payment_status: status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

const loadOrderSummary = async (req, res) => {
  try {
    const { id } = req.query;

    const order = await Orders.findById(id)
      .populate('user_id')
      .populate('items.product_id')
      .populate('payment_type');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).send('Order not found');
    }

    res.render('ordersummary', { order });
  } catch (error) {
    console.error('Error loading order summary:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

module.exports = {
  placeOrder,
  updateOrderStatus,
  loadOrderSummary
};
