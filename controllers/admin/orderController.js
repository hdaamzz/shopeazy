const Products = require('../../models/admin/products');
const Orders = require('../../models/user/userOrders')


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


module.exports = {
    loadOrderList,
    loadupdateStatus,
    updateStatus,
    cancelOrder
    


}