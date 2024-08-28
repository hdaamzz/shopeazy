const User = require('../../models/user/userCredentials');
const Cart = require('../../models/user/cart');
const Wishlist = require('../../models/user/userwhishlist');
const Offer = require('../../models/admin/offers')
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
      const [offers, cartItems] = await Promise.all([
        Offer.find({ status: 'active' }).populate('products').populate('category'),
        Cart.find({ user_id: userid }).populate('product_id')
      ]);

      let subtotal = 0;

      const cartItemsWithDiscounts = cartItems.map((cartItem) => {
        let bestDiscount = 0;
        let hasDiscount = false;
        let discountedPrice = cartItem.product_id.price;

        offers.forEach((offer) => {
          if (offer.type === 'PRODUCT') {
            offer.products.forEach((product) => {
              if (String(cartItem.product_id._id) === String(product._id)) {
                if (offer.discount > bestDiscount) {
                  bestDiscount = offer.discount;
                  hasDiscount = true;
                  discountedPrice = cartItem.product_id.price * (1 - bestDiscount / 100);
                }
              }
            });
          } else if (offer.type === 'CATEGORY') {
            const categoryMatch = offer.category.some(category =>
              String(cartItem.product_id.category) === String(category._id)
            );

            if (categoryMatch && offer.discount > bestDiscount) {
              bestDiscount = offer.discount;
              hasDiscount = true;
              discountedPrice = cartItem.product_id.price * (1 - bestDiscount / 100);
            }
          }
        });

        subtotal += discountedPrice * cartItem.quantity;

        return {
          ...cartItem.toObject(),
          bestDiscount,
          hasDiscount,
          discountedPrice
        };
      });

      res.render('cart', {
        userData,
        cartItems: cartItemsWithDiscounts,
        offers,
        subtotal: subtotal.toFixed(2)
      });
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
   
    res.redirect('/cart')

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

const wishlistToCart = async (req, res) => {
  try {
    const { productId, quantity, userId } = req.body;

    let cartItem = await Cart.findOne({ user_id: userId, product_id: productId });


    if (cartItem) {
        return res.json({ success: false, message: "This product already in cart" });
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

const loadWishlist = async (req, res) => {
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

      res.render('wishlist', { userData, wishlist: wishlistItems })


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
      res.json({ success: false,message:"This product already in cart" });
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
  removeWishlistItem,
  wishlistToCart
};