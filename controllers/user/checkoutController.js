const User = require('../../models/userCredentials');
const Product = require('../../models/products');
const Address = require('../../models/userAddress');
const Cart = require('../../models/cart');
const PaymentType = require('../../models/paymentType');
const Orders = require('../../models/userOrders');
require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });



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

        if (!address_id || !payment_type || !total_amount) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const address = await Address.findById(address_id);
        if (!address) {
            return res.status(400).json({ success: false, message: 'Invalid address ID' });
        }

        const cartItems = await Cart.find({ user_id }).populate('product_id');
        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const payment_type_objId = await PaymentType.findOne({ pay_type: payment_type });
        if (!payment_type_objId) {
            return res.status(400).json({ success: false, message: 'Invalid payment type' });
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
            order_id: `ORD-${randomOrderId}`,
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

        if (payment_type_objId.pay_type === "UPI PAYMENT") {
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(parseFloat(total_amount) * 100),
                currency: "INR",
                receipt: newOrder._id.toString(),
                payment_capture: 1
            });
            newOrder.payment_status="Completed";
            newOrder.razorpay_order_id = razorpayOrder.id;
            await newOrder.save();

            res.status(200).json({ 
                success: true, 
                key: process.env.RAZORPAY_KEY_ID,
                message: 'Order created successfully', 
                orderId: newOrder._id,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            });
        } else {
            res.status(200).json({ 
                success: true, 
                message: 'Order created successfully', 
                orderId: newOrder._id
            });
        }

        // Update product stock
        for (let item of cartItems) {
            await Product.findByIdAndUpdate(
                item.product_id._id,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
        }

        // Clear the cart
        await Cart.deleteMany({ user_id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
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