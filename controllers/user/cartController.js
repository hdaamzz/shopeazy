const User = require('../../models/userCredentials');
const Cart = require('../../models/cart');
require('dotenv').config();


const loadCart = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const userid = userData._id

            const cartItems = await Cart.find({ user_id: userid }).populate('product_id');
            let subtotal = 0;
            cartItems.forEach(item => {
                subtotal += item.product_id.price * item.quantity;
            });
            res.render('cart', { userData, cartItems, subtotal: subtotal.toFixed(2) })


        } else {

            res.redirect('/')
        }
    } catch (error) {
        console.log('Error Load Cart Page', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const loaduserCart = async (req, res) => {
    try {
        res.render('emptycart');

    } catch (error) {
        console.log('Error Load emptyCart Page', error.message);
        res.status(500).send('Internal Server Error');
    }
}


const addCartItem = async (req, res) => {
    try {
        const { productId, quantity, userId } = req.body;

        let cartItem = await Cart.findOne({ user_id: userId, product_id: productId });


        if (cartItem) {
            cartItem.quantity += parseInt(quantity);

            if (cartItem.quantity > 5) {
                return res.json({ success: false, message: "Maximum quanity reached" });
            }
            await cartItem.save();
        } else {
            cartItem = new Cart({
                user_id: userId,
                product_id: productId,
                quantity: quantity
            });
            await cartItem.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.log('Error Add Cart Item', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const updateCartQuantity = async (req, res) => {
    try {
        const { cartItemId, quantity } = req.body;
        await Cart.findByIdAndUpdate(cartItemId, { quantity });
        res.json({ success: true });
    } catch (error) {
        console.log('Error updateCartQuantity ', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const removeCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.body;
        await Cart.findByIdAndDelete(cartItemId);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};










module.exports = {
    loadCart,
    addCartItem,
    updateCartQuantity,
    removeCartItem,
    loaduserCart,
};