const Products = require('../../models/admin/products');
const Orders = require('../../models/user/userOrders');
const ReturnRequest =require('../../models/user/returnRequest');
const Wallet = require('../../models/user/userwallet');
const User = require('../../models/user/userCredentials')


const loadOrderList= async (req, res) => {
    try {
        const orders = await Orders.find({}).populate('user_id').populate('items.product_id').populate('payment_type');;
        res.render('orders', { orders })
    } catch (error) {
        console.error('Error Load Produts:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const loadupdateStatus= async (req, res) => {
    try {
        const id = req.query.id


        const order = await Orders.findById(id).populate('user_id');
        res.render('editstatus', { order })
    } catch (error) {
        console.error('Error Load Produts:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
}

const updateStatus = async (req, res) => {
    try {
        const { hiddenid, productOption} = req.body;

        await Orders.findByIdAndUpdate(hiddenid, {
            $set: {
                order_status: productOption
            }
        });
        
        res.status(200).json({ success: true, message: 'Order status updated successfully', redirectUrl: '/admin/orders' });
    } catch (error) {
        console.error('Error during category update:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { _id } = req.body;
        console.log("Cancelling order:", _id);

        const order = await Orders.findById(_id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.order_status === 'Cancelled' || order.order_status === 'Delivered') {
            return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
        }

        order.order_status = 'Cancelled';
        await order.save();

        
        for (const item of order.items) {
            await Products.findByIdAndUpdate(
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

const loadReturnPage=async (req, res) => {
    try {
        const returnRequests = await ReturnRequest.find()
            .populate('order_id')
            .populate('user_id');
        res.render('showReturns', { returnRequests });
    } catch (error) {
        console.error('Error fetching return requests:', error);
        res.status(500).send('An error occurred while fetching return requests');
    }
};

const updateReturnRequest = async (req, res) => {

    try {
        const { request_id, status, admin_response,orderId } = req.body;
        console.log( request_id, status, admin_response,orderId );
        

        if (!request_id || !status || !admin_response) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const returnRequest = await ReturnRequest.findById(request_id).populate('order_id');
        if (!returnRequest) {

            return res.status(404).json({ success: false, message: 'Return request not found' });
        }

        const updateresponse = await ReturnRequest.findByIdAndUpdate(request_id, {
            $set: {
                status:status,
                admin_response:admin_response,
            }
        }, { new: true });
        // const updateorderstatus = await Orders.findByIdAndUpdate(returnRequest.order_id, {
        //     $set: {
        //        order_status:'Returned'
        //     }
        // }, { new: true });

        const order = returnRequest.order_id;
        
        if (status === 'Approved') {
            order.order_status = 'Returned';
            
            // if (order.payment_type.pay_type) {
            //     const randomID = Math.floor(100000 + Math.random() * 900000);
            //     const refundAmount = parseFloat(order.total_amount);

            //     let wallet = await Wallet.findOne({ user_id: order.user_id });
                
            //     if (wallet) {
            //         wallet.balance += refundAmount;
            //         wallet.history.push({
            //             amount: refundAmount,
            //             transaction_type: "Returned",
            //             description: "Product Return Refund",
            //             transaction_id: `TRX-${randomID}`
            //         });
            //     } else {
            //         wallet = new Wallet({
            //             user_id: order.user_id,
            //             balance: refundAmount,
            //             history: [{
            //                 amount: refundAmount,
            //                 transaction_type: "Returned",
            //                 description: "Product Return Refund",
            //                 transaction_id: `TRX-${randomID}`
            //             }]
            //         });
            //     }

            //     await wallet.save({});
            // }

            for (const item of order.items) {
                await Products.findByIdAndUpdate(
                    item.product_id,
                    { $inc: { stock: item.quantity } },
                    { new: true}
                );
            }
        } else if (status === 'Rejected') {
            
            const updateresponse = await ReturnRequest.findByIdAndUpdate(request_id, {
                $set: {
                    status:"Rejected",
                    admin_response:admin_response,
                }
            }, { new: true });
        }


        res.json({ success: true, message: "Return request updated successfully" });
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