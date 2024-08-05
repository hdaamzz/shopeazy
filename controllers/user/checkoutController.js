const User = require('../../models/userCredentials');
const Product = require('../../models/products');
const Address = require('../../models/userAddress');
const Cart = require('../../models/cart');
const PaymentType = require('../../models/paymentType');
const Orders = require('../../models/userOrders');
require('dotenv').config();




const loadCheckout = async (req, res) => {
    try {

        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }
        if (userData) {
            const userid = userData._id
            const cartData = await Cart.find({ user_id: userid }).populate('product_id');
            const addressData = await Address.find({ user_id: userid });
            let subtotal = 0;
            cartData.forEach(item => {
                subtotal += item.product_id.price * item.quantity;
            });
            const paymentTypes = await PaymentType.find({})
            res.render('checkout', { userData, addressData, cartData, subtotal: subtotal.toFixed(2), paymentTypes })
        } else {
            res.redirect('/')

        }
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
}
const placeOrder = async (req, res) => {
    try {
        const { address_id, payment_type, total_amount } = req.body;
        const user_id = req.session.user_id;
        const address = await Address.findById(address_id)
        const cartItems = await Cart.find({ user_id }).populate('product_id');

        const payment_type_objId = await PaymentType.findOne({ pay_type: payment_type });

        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const orderItems = cartItems.map(item => ({
            product_id: item.product_id._id,
            name: item.product_id.product_name,
            quantity: item.quantity,
            price: item.product_id.price,
            total: item.product_id.price * item.quantity
        }));
        const randomOrderId = Math.floor(1000 + Math.random() * 9000);

        const newOrder = new Orders({
            user_id,
            order_id: `ORD-${randomOrderId} `,
            address_id: address,
            items: orderItems,
            total_amount: parseFloat(total_amount),
            payment_type: payment_type_objId._id,
            payment_status: 'Pending',
            order_status: 'Pending',
            shipping_cost: 0,
            tax: 0,
            discount: 0
        });

        await newOrder.save();
        for (let item of cartItems) {
            await Product.findByIdAndUpdate(
                item.product_id._id,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
        }
        await Cart.deleteMany({ user_id });
        res.status(200).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const loadOrderSummary = async (req, res) => {
    try {
        const orderId = req.query.id;

        const order = await Orders.findById(orderId)
            .populate('user_id')
            .populate('items.product_id')
            .populate('payment_type');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('ordersummary', { order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


module.exports = {
    
    loadCheckout,
    placeOrder,
    loadOrderSummary


};