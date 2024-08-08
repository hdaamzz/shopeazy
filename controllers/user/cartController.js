const User = require('../../models/userCredentials');
const Cart = require('../../models/cart');
const Wishlist = require('../../models/userwhishlist');
const Offer =require('../../models/offers')
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
        const userid = userData._id;
        const offers = await Offer.find({ status: 'active', type: 'PRODUCT' }).populate('products');
        const cartItems = await Cart.find({ user_id: userid }).populate('product_id');
        let subtotal = 0;
        cartItems.forEach((item) => {
          let discountedPrice = item.product_id.price;
          let hasDiscount = false;
        
          offers.forEach((offer) => {
            offer.products.forEach((product) => {
              if (String(product._id) === String(item.product_id._id)) {
                if (offer.discount > 0) {
                  discountedPrice = item.product_id.price * (1 - offer.discount / 100);
                  hasDiscount = true;
                }
              }
            });
          });
        
          subtotal += discountedPrice * item.quantity;
        });
  
        res.render('cart', { userData, cartItems, offers, subtotal: subtotal.toFixed(2) });
      } else {
        res.redirect('/');
      }
    } catch (error) {
      console.log('Error Load Cart Page', error.message);
      res.status(500).send('Internal Server Error');
    }
  };
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

const loadWishlist =async(req,res)=>{
try {
    let userData;
    if (req.user) {
        userData = req.user;
    } else if (req.session.user_id) {

        userData = await User.findById(req.session.user_id);
    }

    if (userData) {
        const userid = userData._id

        const wishlistItems = await Wishlist.find({ user_id: userid }).populate('product_id');
  
        res.render('wishlist', { userData, wishlist:wishlistItems})


    } else {

        res.redirect('/')
    }
} catch (error) {
    
}
}

const addWishlistItem = async (req, res) => {
    try {
        const { productId, userId } = req.body;

        let cartItem = await Wishlist.findOne({ user_id: userId, product_id: productId });


        if (cartItem) {
            res.json({ success: true });
        } else {
            wishlistItem = new Wishlist({
                user_id: userId,
                product_id: productId
            });
            await wishlistItem.save();
            res.json({ success: true });
        }

       
    } catch (error) {
        console.log('Error Add Cart Item', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const removeWishlistItem = async (req, res) => {
    try {
        const { cartItemId } = req.body;
        await Wishlist.findByIdAndDelete(cartItemId);
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
    loadWishlist,
    addWishlistItem,
    removeWishlistItem
};