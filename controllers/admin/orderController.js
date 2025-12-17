const Product = require('../../models/admin/products');
const Orders = require('../../models/user/userOrders');
const ReturnRequest = require('../../models/user/returnRequest');
const Wallet = require('../../models/user/userwallet');
const { HTTP_STATUS } = require('../../utils/constants');

// Constants
const ORDERS_PER_PAGE = 10;
const PAYMENT_STATUS_EXCLUDED = ['Processing', 'Failed'];
const ORDER_STATUS = {
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
  RETURN_REJECTED: 'Return Rejected'
};
const PAYMENT_STATUS = {
  COMPLETED: 'Completed'
};
const RETURN_REQUEST_STATUS = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};
const TRANSACTION_TYPE = {
  RETURNED: 'Returned'
};

const loadOrderList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ORDERS_PER_PAGE;

    const [orders, totalOrders] = await Promise.all([
      Orders.find({ payment_status: { $nin: PAYMENT_STATUS_EXCLUDED } })
        .populate('user_id')
        .populate('items.product_id')
        .populate('payment_type')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(ORDERS_PER_PAGE),
      Orders.countDocuments({ payment_status: { $nin: PAYMENT_STATUS_EXCLUDED } })
    ]);

    const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);

    res.render('orders', {
      orders,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error('Error loading orders:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading orders'
    });
  }
};

const loadUpdateStatus = async (req, res) => {
  try {
    const { orderid, itemid } = req.query;

    const order = await Orders.findById(orderid)
      .populate('payment_type')
      .populate('items.product_id');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).redirect('/admin/orders');
    }

    const orderItem = order.items.find(item => item._id.equals(itemid));

    if (!orderItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).redirect('/admin/orders');
    }

    res.render('editstatus', { order, products: orderItem });
  } catch (error) {
    console.error('Error loading order status page:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading order status'
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { hiddenid, productOption, hiddenitemId } = req.body;

    if (productOption === ORDER_STATUS.DELIVERED) {
      await Orders.findByIdAndUpdate(
        hiddenid,
        { $set: { payment_status: PAYMENT_STATUS.COMPLETED } },
        { new: true, runValidators: true }
      );
    }

    const updatedOrder = await Orders.findOneAndUpdate(
      {
        _id: hiddenid,
        'items._id': hiddenitemId
      },
      {
        $set: { 'items.$.status': productOption }
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order or item not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order status updated successfully',
      redirectUrl: '/admin/orders'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while updating order status'
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { _id, itemId } = req.body;

    const order = await Orders.findById(_id)
      .populate('payment_type')
      .populate('items.product_id');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderItem = order.items.find(item => item._id.equals(itemId));

    if (!orderItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order item not found'
      });
    }

    if (orderItem.status === ORDER_STATUS.CANCELLED || orderItem.status === ORDER_STATUS.DELIVERED) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Cannot cancel this order'
      });
    }

    orderItem.status = ORDER_STATUS.CANCELLED;
    await order.save();

    await Product.findByIdAndUpdate(
      orderItem.product_id,
      { $inc: { stock: orderItem.quantity } }
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


const loadReturnRequests = async (req, res) => {
  try {
    let returnRequests = await ReturnRequest.find()
      .populate('order_id')
      .populate('user_id')
      .lean();

    returnRequests = returnRequests.map(request => {
      if (request.order_id && request.order_id.items) {
        const item = request.order_id.items.find(
          item => item._id.toString() === request.item_id.toString()
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
    res.status(HTTP_STATUS.SERVER_ERROR).send('An error occurred while loading return requests');
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

    const itemStatus = status === RETURN_REQUEST_STATUS.APPROVED
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

async function processReturnRefund(orderId, itemId) {
  try {
    const order = await Orders.findOne(
      { order_id: orderId, 'items._id': itemId }
    ).populate('payment_type');

    const orderItem = order.items.find(item => item._id.equals(itemId));

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
        history: [{
          amount: refundAmount,
          transaction_type: TRANSACTION_TYPE.RETURNED,
          description: 'Product Return Refund',
          transaction_id: transactionId
        }]
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
}

function generateTransactionId() {
  const randomId = Math.floor(100000 + Math.random() * 900000);
  return `TRX-${randomId}`;
}

module.exports = {
  loadOrderList,
  loadUpdateStatus,
  updateStatus,
  cancelOrder,
  loadReturnRequests,
  updateReturnRequest
};
