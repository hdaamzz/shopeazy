const { HTTP_STATUS } = require('../../utils/constants');
const Product = require('../../models/admin/products');
const Orders = require('../../models/user/userOrders');
const ReturnRequest = require('../../models/user/returnRequest');
const Wallet = require('../../models/user/userwallet');

const ORDER_STATUS = {
  RETURNED: 'Returned',
  RETURN_REJECTED: 'Return Rejected'
};

const RETURN_REQUEST_STATUS = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

const TRANSACTION_TYPE = {
  RETURNED: 'Returned'
};

const generateTransactionId = () => {
  const randomId = Math.floor(100000 + Math.random() * 900000);
  return `TRX-${randomId}`;
};

const processReturnRefund = async (orderId, itemId) => {
  try {
    const order = await Orders.findOne({
      order_id: orderId,
      'items._id': itemId
    }).populate('payment_type');

    const orderItem = order.items.find((item) => item._id.equals(itemId));

    if (!orderItem) {
      throw new Error('Order item not found');
    }

    const refundAmount = parseFloat(orderItem.total);
    const transactionId = generateTransactionId();

    let wallet = await Wallet.findOne({ user_id: order.user_id });

    if (wallet) {
      wallet.balance += refundAmount;
      wallet.history.push({
        amount: refundAmount,
        transaction_type: TRANSACTION_TYPE.RETURNED,
        description: 'Product Return Refund',
        transaction_id: transactionId
      });
    } else {
      wallet = new Wallet({
        user_id: order.user_id,
        balance: refundAmount,
        history: [
          {
            amount: refundAmount,
            transaction_type: TRANSACTION_TYPE.RETURNED,
            description: 'Product Return Refund',
            transaction_id: transactionId
          }
        ]
      });
    }

    await wallet.save();

    await Product.findByIdAndUpdate(
      orderItem.product_id,
      { $inc: { stock: orderItem.quantity } },
      { new: true }
    );
  } catch (error) {
    console.error('Error processing return refund:', error);
    throw error;
  }
};

const loadReturnRequests = async (req, res) => {
  try {
    let returnRequests = await ReturnRequest.find()
      .populate('order_id')
      .populate('user_id')
      .lean();

    returnRequests = returnRequests.map((request) => {
      if (request.order_id && request.order_id.items) {
        const item = request.order_id.items.find(
          (item) => item._id.toString() === request.item_id.toString()
        );
        if (item) {
          request.item = item;
        }
      }
      return request;
    });

    res.render('showReturns', { returnRequests });
  } catch (error) {
    console.error('Error loading return requests:', error);
    res
      .status(HTTP_STATUS.SERVER_ERROR)
      .send('An error occurred while loading return requests');
  }
};

const updateReturnRequest = async (req, res) => {
  try {
    const { request_id, status, admin_response, orderId, itemId } = req.body;

    if (!request_id || !status || !admin_response || !orderId || !itemId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const returnRequest = await ReturnRequest.findById(request_id).populate('order_id');
    if (!returnRequest) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Return request not found'
      });
    }

    await ReturnRequest.findByIdAndUpdate(
      request_id,
      {
        status,
        admin_response
      },
      { new: true }
    );

    const itemStatus =
      status === RETURN_REQUEST_STATUS.APPROVED
        ? ORDER_STATUS.RETURNED
        : ORDER_STATUS.RETURN_REJECTED;

    const updatedOrder = await Orders.findOneAndUpdate(
      { order_id: orderId, 'items._id': itemId },
      {
        $set: { 'items.$.status': itemStatus }
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order or item not found'
      });
    }

    if (status === RETURN_REQUEST_STATUS.APPROVED) {
      await processReturnRefund(orderId, itemId);
    }

    res.json({
      success: true,
      message: 'Return request and order updated successfully'
    });
  } catch (error) {
    console.error('Error updating return request:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update return request',
      error: error.message
    });
  }
};

module.exports = {
  loadReturnRequests,
  updateReturnRequest
};
