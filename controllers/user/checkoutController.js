const crypto = require('crypto');
const User = require('../../models/user/userCredentials');
const Product = require('../../models/admin/products');
const Address = require('../../models/user/userAddress');
const Cart = require('../../models/user/cart');
const PaymentType = require('../../models/admin/paymentType');
const Orders = require('../../models/user/userOrders');
const Offer = require('../../models/admin/offers');
const Coupon = require('../../models/admin/coupons')
require('dotenv').config();
const Razorpay = require('razorpay');
const { validationResult } = require('express-validator');

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
            const userid = userData._id;
            const [coupons, cartData, offers, addressData, paymentTypes] = await Promise.all([
                Coupon.find({}),
                Cart.find({ user_id: userid }).populate('product_id'),
                Offer.find({ status: 'active' }).populate('products').populate('category'),
                Address.find({ user_id: userid }),
                PaymentType.find({})
              ]);
              

            let subtotal = 0;
            const cartItemsWithDiscounts = cartData.map((item) => {
                let bestDiscount = 0;
                let discountedPrice = item.product_id.price;
                let hasDiscount = false;
                let appliedOffer = null;

                offers.forEach((offer) => {
                    if (offer.type === 'PRODUCT') {
                        offer.products.forEach((product) => {
                            if (String(product._id) === String(item.product_id._id)) {
                                if (offer.discount > bestDiscount) {
                                    bestDiscount = offer.discount;
                                    hasDiscount = true;
                                    appliedOffer = offer;
                                }
                            }
                        });
                    } else if (offer.type === 'CATEGORY') {
                        const categoryMatch = offer.category.some(category => 
                            String(item.product_id.category) === String(category._id)
                        );
                        
                        if (categoryMatch && offer.discount > bestDiscount) {
                            bestDiscount = offer.discount;
                            hasDiscount = true;
                            appliedOffer = offer;
                        }
                    }
                });

                if (hasDiscount) {
                    discountedPrice = item.product_id.price * (1 - bestDiscount / 100);
                }

                subtotal += discountedPrice * item.quantity;

                return {
                    ...item.toObject(),
                    discountedPrice,
                    hasDiscount,
                    appliedOffer
                };
            });

            res.render('checkout', { 
                userData, 
                addressData, 
                cartData: cartItemsWithDiscounts, 
                subtotal: subtotal.toFixed(2), 
                paymentTypes,
                offers,
                coupons
            });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('404', { message: 'Server error' });
    }
};

const placeOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { address_id, payment_type, total_amount, coupon_discount,couponPercent } = req.body;
        const user_id = req.session.user_id;
        
       
        
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

        if (parseFloat(total_amount) > 1000 && payment_type_objId.pay_type === "CASH ON DELIVERY") {
            return res.status(400).json({ 
                success: false, 
                message: 'Cash on Delivery is not available for orders above ₹1000. Please choose a different payment method.'
            });
        }
    if (payment_type_objId.pay_type === "UPI PAYMENT") {
            const offers = await Offer.find({ status: 'active' }).populate('products').populate('category');
            const orderItems = calculateOrderItems(cartItems, offers,couponPercent);
    
            const randomOrderId = Math.floor(10000 + Math.random() * 90000);
            const newOrder = new Orders({
                user_id,
                order_id: `ORD-${randomOrderId}`,
                address_id: address,
                items: orderItems,
                total_amount: parseFloat(total_amount),
                payment_type: payment_type_objId._id,
                payment_status: 'Processing',
                shipping_cost: 0,
                tax: 0,
                discount: parseFloat(coupon_discount) || 0 
            });
    
            await newOrder.save();
            const razorpayOrder = await createRazorpayOrder(newOrder, total_amount);
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

    }else{
        const offers = await Offer.find({ status: 'active' }).populate('products').populate('category');
        const orderItems = calculateOrderItems(cartItems, offers,couponPercent);

        const randomOrderId = Math.floor(10000 + Math.random() * 90000);
        const newOrder = new Orders({
            user_id,
            order_id: `ORD-${randomOrderId}`,
            address_id: address,
            items: orderItems,
            total_amount: parseFloat(total_amount),
            payment_type: payment_type_objId._id,
            payment_status: 'Pending',
            shipping_cost: 0,
            tax: 0,
            discount: parseFloat(coupon_discount) || 0 
        });

        await newOrder.save();
        res.status(200).json({ 
            success: true, 
            message: 'Order created successfully', 
            orderId: newOrder._id
        });

    }
        // if (payment_type_objId.pay_type === "UPI PAYMENT") {
           
        // } else {
           
        // }

        await updateProductStock(cartItems);
        await Cart.deleteMany({ user_id });

    }catch (error) {
        console.error('Error in placeOrder:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message, stack: error.stack });
    }
};

function calculateOrderItems(cartItems, offers,couponPercent) {
    return cartItems.map(item => {
        let bestDiscount = 0;
        let discountedPrice
        if(couponPercent > 0){
            discountedPrice = item.product_id.price * (1 - couponPercent / 100);
        }else{
            discountedPrice = item.product_id.price
        }
       

        offers.forEach((offer) => {
            if (offer.type === 'PRODUCT' && offer.products.some(product => String(product._id) === String(item.product_id._id))) {
                bestDiscount = Math.max(bestDiscount, offer.discount);
            } else if (offer.type === 'CATEGORY' && offer.category.some(category => String(item.product_id.category) === String(category._id))) {
                bestDiscount = Math.max(bestDiscount, offer.discount);
            }
        });

        if (bestDiscount > 0) {
            discountedPrice = item.product_id.price * (1 - bestDiscount / 100);
            if(couponPercent > 0){
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
            status: 'Pending',
            total: parseFloat((finalPrice * item.quantity).toFixed(2))
        };
    });
}

async function createRazorpayOrder(order, total_amount) {
    return await razorpay.orders.create({
        amount: Math.round(parseFloat(total_amount) * 100),
        currency: "INR",
        receipt: order._id.toString(),
        payment_capture: 1
    });
}

async function updateProductStock(cartItems, session) {
    for (let item of cartItems) {
        await Product.findByIdAndUpdate(
            item.product_id._id,
            { $inc: { stock: -item.quantity } },
            { new: true, session }
        );
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const updatedOrder = await Orders.findByIdAndUpdate(orderId, { payment_status: status }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const updatedOrder = await Orders.findByIdAndUpdate(
                orderId,
                { 
                    payment_status: 'Completed',
                    'payment_details.razorpay_order_id': razorpay_order_id,
                    'payment_details.razorpay_payment_id': razorpay_payment_id,
                    'payment_details.razorpay_signature': razorpay_signature
                },
                { new: true }
            );

            if (!updatedOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            await Orders.findByIdAndUpdate(
                orderId,
                { $set: { "items.$[].status": "Processing" } },
                { new: true }
            );

            res.json({
                success: true,
                message: 'Payment has been verified',
                order: updatedOrder
            });
        } else {
            await Orders.findByIdAndUpdate(
                orderId,
                { payment_status: 'Failed' },
                { new: true }
            );

            res.json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Error in verifyPayment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


const paymentFailure = async (req, res) => {
    try {
        const { razorpay_order_id, orderId } = req.body;

        const updatedOrder = await Orders.findByIdAndUpdate(
            orderId,
            { 
                payment_status: 'Failed' || 'Pending',
                'payment_details.razorpay_order_id': razorpay_order_id
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Payment failure recorded',
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error in handlePaymentFailure:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
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


const applyCoupon = async (req, res) => {
    try {
        const { couponCode, subtotal } = req.body;

       
        if (typeof subtotal !== 'number' || isNaN(subtotal) || subtotal < 0) {
            return res.status(400).json({ success: false, message: 'Invalid subtotal' });
        }

       
        const coupon = await Coupon.findOne({ couponId: { $regex: new RegExp(`^${couponCode}$`, 'i') } });

        if (!coupon) {
            return res.json({ success: false, message: 'Invalid coupon code' });
        }

        if (!coupon.is_active) {
            return res.json({ success: false, message: 'This coupon is no longer active' });
        }

        if (new Date() > new Date(coupon.expiryDate)) {
            return res.json({ success: false, message: 'This coupon has expired' });
        }

        if (subtotal < coupon.min_purchase_amount) {
            return res.json({ success: false, message: `Minimum purchase amount for this coupon is ₹${coupon.min_purchase_amount}` });
        }
        if (subtotal > coupon.max_amount) {
            return res.json({ success: false, message: `Maximum purchase amount for this coupon is ₹${coupon.max_amount}` });
        }

        let discountAmount = (subtotal * coupon.discount) / 100;
        if (coupon.max_amount && discountAmount > coupon.max_amount) {
            discountAmount = coupon.max_amount;
        }

        discountPercent=coupon.discount;
       
        discountAmount = Math.round(discountAmount * 100) / 100;
        const newTotal = Math.round((subtotal - discountAmount) * 100) / 100;

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            discountAmount,
            discountPercent,
            newTotal
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'An error occurred while applying the coupon' });
    }
};
const removeCoupon =async (req, res) => {
    try {

       const subtotal = req.body.subtotal

        res.json({
            success: true,
            message: 'Coupon removed successfully',
            newTotal: subtotal
        });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while removing the coupon'
        });
    }
}

module.exports = {
    
    loadCheckout,
    placeOrder,
    loadOrderSummary,
    applyCoupon,
    removeCoupon,
    updateOrderStatus,
    verifyPayment,
    paymentFailure


};