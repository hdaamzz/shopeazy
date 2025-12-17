const { HTTP_STATUS } = require('../../../utils/constants');
const User = require('../../../models/user/userCredentials');
const Cart = require('../../../models/user/cart');
const Offer = require('../../../models/admin/offers');
const { getAuthenticatedUser } = require('../../../helpers/userHelper');

const OFFER_TYPES = {
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY'
};

const OFFER_STATUS = {
  ACTIVE: 'active'
};

const MAX_CART_QUANTITY = 5;

const calculateItemDiscount = (cartItem, offers) => {
  let bestDiscount = 0;
  let hasDiscount = false;
  let discountedPrice = cartItem.product_id.price;

  offers.forEach((offer) => {
    if (offer.type === OFFER_TYPES.PRODUCT) {
      offer.products.forEach((product) => {
        if (String(cartItem.product_id._id) === String(product._id)) {
          if (offer.discount > bestDiscount) {
            bestDiscount = offer.discount;
            hasDiscount = true;
            discountedPrice = cartItem.product_id.price * (1 - bestDiscount / 100);
          }
        }
      });
    } else if (offer.type === OFFER_TYPES.CATEGORY) {
      const categoryMatch = offer.category.some(
        (category) => String(cartItem.product_id.category) === String(category._id)
      );

      if (categoryMatch && offer.discount > bestDiscount) {
        bestDiscount = offer.discount;
        hasDiscount = true;
        discountedPrice = cartItem.product_id.price * (1 - bestDiscount / 100);
      }
    }
  });

  return { bestDiscount, hasDiscount, discountedPrice };
};

const loadCart = async (req, res) => {
  try {
    const userData = await getAuthenticatedUser(req);
    if (!userData) return res.redirect('/');

    const [offers, cartItems] = await Promise.all([
      Offer.find({ status: OFFER_STATUS.ACTIVE })
        .populate('products')
        .populate('category'),
      Cart.find({ user_id: userData._id }).populate('product_id')
    ]);

    let subtotal = 0;

    const cartItemsWithDiscounts = cartItems.map((cartItem) => {
      const { bestDiscount, hasDiscount, discountedPrice } = calculateItemDiscount(
        cartItem,
        offers
      );
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
  } catch (error) {
    console.error('Error loading cart:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Internal Server Error');
  }
};

const loadUserCart = async (req, res) => {
  try {
    res.redirect('/cart');
  } catch (error) {
    console.error('Error redirecting to cart:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Internal Server Error');
  }
};

const addCartItem = async (req, res) => {
  try {
    const { productId, quantity, userId } = req.body;

    const existingCartItem = await Cart.findOne({
      user_id: userId,
      product_id: productId
    });

    if (existingCartItem) {
      return res.json({
        success: false,
        message: 'This product is already in cart'
      });
    }

    const newCartItem = new Cart({
      user_id: userId,
      product_id: productId,
      quantity
    });

    await newCartItem.save();

    res.json({ success: true, message: 'Product added to cart successfully' });
  } catch (error) {
    console.error('Error adding cart item:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
};

const moveWishlistToCart = async (req, res) => {
  try {
    const { productId, quantity, userId } = req.body;

    const existingCartItem = await Cart.findOne({
      user_id: userId,
      product_id: productId
    });

    if (existingCartItem) {
      return res.json({
        success: false,
        message: 'This product is already in cart'
      });
    }

    const newCartItem = new Cart({
      user_id: userId,
      product_id: productId,
      quantity
    });

    await newCartItem.save();

    res.json({ success: true, message: 'Product moved to cart successfully' });
  } catch (error) {
    console.error('Error moving wishlist item to cart:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to move item to cart'
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;

    if (quantity > MAX_CART_QUANTITY) {
      return res.json({
        success: false,
        message: `Maximum quantity is ${MAX_CART_QUANTITY}`
      });
    }

    await Cart.findByIdAndUpdate(cartItemId, { quantity });

    res.json({ success: true, message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update cart'
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.body;

    await Cart.findByIdAndDelete(cartItemId);

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

module.exports = {
  loadCart,
  loadUserCart,
  addCartItem,
  moveWishlistToCart,
  updateCartQuantity,
  removeCartItem
};
