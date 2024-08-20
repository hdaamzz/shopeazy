const Product = require('../../models/admin/products');
const Orders = require('../../models/user/userOrders');
const ReturnRequest =require('../../models/user/returnRequest');
const Wallet = require('../../models/user/userwallet');
const User = require('../../models/user/userCredentials')


const loadOrderList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;

        const [orders, totalOrders] = await Promise.all([
            Orders.find({})
                .populate('user_id')
                .populate('items.product_id')
                .populate('payment_type')
                .sort({created_at: -1})
                .skip(skip)
                .limit(limit),
            Orders.countDocuments({})
        ]);

        const totalPages = Math.ceil(totalOrders / limit);

        res.render('orders', { 
            orders: orders,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error Loading Orders:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const loadupdateStatus= async (req, res) => {
    try {
        const orderid = req.query.orderid
        const itemid = req.query.itemid
        console.log(orderid,itemid);
        

        const order = await Orders.findById(orderid).populate('payment_type').populate('items.product_id')
        const products =  order.items.find(product=>product._id.equals(itemid))
        res.render('editstatus', { order , products })
    } catch (error) {
        console.error('Error Load Produts:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const updateStatus = async (req, res) => {
    try {
        const { hiddenid, productOption, hiddenitemId } = req.body;

        if(productOption ==='Delivered'){
            const updatedPaymentStatus = await Orders.findOneAndUpdate(
                { 
                    _id: hiddenid 
                },
                { 
                    $set: { 
                        payment_status: 'Completed' 
                    } 
                },
                { new: true, runValidators: true }
            );
        }
        const updatedOrder = await Orders.findOneAndUpdate(
            { 
                _id: hiddenid, 
                "items._id": hiddenitemId 
            },
            { 
                $set: { 
                    "items.$.status": productOption 
                } 
            },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order or item not found' });
        }

        res.status(200).json({ success: true, message: 'Order status updated successfully', redirectUrl: '/admin/orders' });
    } catch (error) {
        console.error('Error during order status update:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { _id ,itemId} = req.body;
        const order = await Orders.findById(_id).populate('payment_type').populate('items.product_id')
        const products =  order.items.find(product=>product._id.equals(itemId))

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (products.status === 'Cancelled' || order.order_status === 'Delivered') {
            return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
        }

        products.status = 'Cancelled';
        await order.save();

        
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product_id,
                { $inc: { stock: item.quantity } }
            );
        }

        res.json({ success: true, message: "Order Cancelled Successfully and Stock Updated" });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
};

const loadReturnPage = async (req, res) => {
    try {
        let returnRequests = await ReturnRequest.find()
            .populate('order_id')
            .populate('user_id')
            .lean();

       
        returnRequests = returnRequests.map(request => {
            if (request.order_id && request.order_id.items) {
                const item = request.order_id.items.find(item => item._id.toString() === request.item_id.toString());
                if (item) {
                    request.item = item;  
                }
            } else {
                console.log('Order or items not found');
            }
            return request;
        });

        res.render('showReturns', { returnRequests });
    } catch (error) {
        console.error('Error fetching return requests:', error);
        res.status(500).send('An error occurred while fetching return requests');
    }
};

const updateReturnRequest = async (req, res) => {
    try {
        const { request_id, status, admin_response, orderId, itemId } = req.body;

        if (!request_id || !status || !admin_response || !orderId || !itemId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const returnRequest = await ReturnRequest.findById(request_id).populate('order_id');
        if (!returnRequest) {
            return res.status(404).json({ success: false, message: 'Return request not found' });
        }

       
        const updatedReturnRequest = await ReturnRequest.findByIdAndUpdate(request_id, {
            status: status,
            admin_response: admin_response,
        }, { new: true });

      
       
        const updatedOrder = await Orders.findOneAndUpdate(
           { order_id: orderId, "items._id": itemId},
            { 
                $set: { 
                    "items.$.status": status === 'Approved' ? 'Returned' : 'Return Rejected',
                }
            },
            { new: true }
        );
        const order = await Orders.findOne(
            { order_id: orderId, "items._id": itemId }
        ).populate('payment_type');
        const products =  order.items.find(product=>product._id.equals(itemId))
        console.log(products);
        const currentItem = order.items[0];
        const currentTotal = products.total;
        const userID = order.user_id;
        

        if (status === 'Approved') {
            const randomID = Math.floor(100000 + Math.random() * 900000);
            const refundAmount = parseFloat(currentTotal);

            let wallet = await Wallet.findOne({ user_id: userID });
            console.log(wallet);
            
            
            if (wallet) {
                wallet.balance += refundAmount;
                wallet.history.push({
                    amount: refundAmount,
                    transaction_type: "Returned",
                    description: "Product Return Refund",
                    transaction_id: `TRX-${randomID}`
                });
            } else {
                wallet = new Wallet({
                    user_id: order.user_id,
                    balance: refundAmount,
                    history: [{
                        amount: refundAmount,
                        transaction_type: "Returned",
                        description: "Product Return Refund",
                        transaction_id: `TRX-${randomID}`
                    }]
                });
            }

            await wallet.save({});
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.product_id,
                    { $inc: { stock: item.quantity } },
                    { new: true}
                );
            }
        }else if (status === 'Rejected') {
            
                        const updateresponse = await ReturnRequest.findByIdAndUpdate(request_id, {
                            $set: {
                                status:"Rejected",
                                admin_response:admin_response,
                            }
                        }, { new: true });
        }

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order or item not found' });
        }

        res.json({ success: true, message: "Return request and order updated successfully" });
    } catch (error) {
        console.error('Error updating return request:', error);
        res.status(500).json({ success: false, message: 'Failed to update return request', error: error.message });
    }
};


module.exports = {
    loadOrderList,
    loadupdateStatus,
    updateStatus,
    cancelOrder,
    loadReturnPage,
    updateReturnRequest
    
}