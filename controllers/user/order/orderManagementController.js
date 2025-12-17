const { HTTP_STATUS } = require('../../../utils/constants');
const Product = require('../../../models/admin/products');
const Orders = require('../../../models/user/userOrders');
const ReturnRequest = require('../../../models/user/returnRequest');
const Wallet = require('../../../models/user/userwallet');

const PAYMENT_TYPES = {
  UPI_PAYMENT: 'UPI PAYMENT'
};

const PAYMENT_STATUS = {
  COMPLETED: 'Completed'
};

const ORDER_STATUS = {
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return Requested'
};

const TRANSACTION_TYPES = {
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned'
};

const generateTransactionId = () => {
  const randomId = Math.floor(100000 + Math.random() * 900000);
  return `TRX-${randomId}`;
};

const processRefundToWallet = async (userId, amount, transactionType, description) => {
  const transactionId = generateTransactionId();
  const refundAmount = parseFloat(amount);

  let wallet = await Wallet.findOne({ user_id: userId });

  if (wallet) {
    wallet.balance += refundAmount;
    wallet.history.push({
      amount: refundAmount,
      transaction_type: transactionType,
      description,
      transaction_id: transactionId
    });
  } else {
    wallet = new Wallet({
      user_id: userId,
      balance: refundAmount,
      history: [
        {
          amount: refundAmount,
          transaction_type: transactionType,
          description,
          transaction_id: transactionId
        }
      ]
    });
  }

  await wallet.save();
};

const cancelOrder = async (req, res) => {
  try {
    const { _id, cancel_reason, item_id } = req.body;

    const order = await Orders.findById(_id)
      .populate('payment_type')
      .populate('items.product_id');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderItem = order.items.find((item) => item._id.equals(item_id));

    if (!orderItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order item not found'
      });
    }

    if (
      order.payment_type.pay_type === PAYMENT_TYPES.UPI_PAYMENT &&
      order.payment_status === PAYMENT_STATUS.COMPLETED
    ) {
      await processRefundToWallet(
        req.session.user_id,
        orderItem.total,
        TRANSACTION_TYPES.CANCELLED,
        'Product Cancelled Refund'
      );
    }

    orderItem.status = ORDER_STATUS.CANCELLED;
    orderItem.cancellation_reason = cancel_reason;
    await order.save();

    await Product.findByIdAndUpdate(
      orderItem.product_id,
      { $inc: { stock: orderItem.quantity } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Order cancelled successfully and stock updated'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
};

const returnOrder = async (req, res) => {
  try {
    const { order_id, return_reason, item_id } = req.body;

    const order = await Orders.findById(order_id);

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderItem = order.items.find((item) => item._id.equals(item_id));

    if (!orderItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order item not found'
      });
    }

    if (orderItem.status !== ORDER_STATUS.DELIVERED) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Only delivered orders can be returned'
      });
    }

    const returnRequest = new ReturnRequest({
      item_id: orderItem._id,
      order_id: order._id,
      user_id: req.session.user_id,
      reason: return_reason,
      status: 'Pending'
    });

    await returnRequest.save();

    orderItem.status = ORDER_STATUS.RETURN_REQUESTED;
    await order.save();

    res.json({
      success: true,
      message: 'Return request submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting return request:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to submit return request'
    });
  }
};

module.exports = {
  cancelOrder,
  returnOrder
};
