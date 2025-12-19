const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/user/cart/cartController');
const wishlistController = require('../../controllers/user/cart/wishlistController');
const auth = require('../../middleware/userAuth');

router.get('/cart', auth.isLogin, cartController.loadCart);
router.get('/nonUserCart', auth.isLogout, cartController.loadUserCart);
router.post('/addCartItem', auth.isLogin, cartController.addCartItem);
router.post('/wishlistToCart', auth.isLogin, cartController.moveWishlistToCart);
router.patch('/update-cart-quantity', auth.isLogin, cartController.updateCartQuantity);
router.delete('/remove-from-cart', auth.isLogin, cartController.removeCartItem);

router.get('/wishlist', auth.isLogin, wishlistController.loadWishlist);
router.post('/addWishlistItem', auth.isLogin, wishlistController.addWishlistItem);
router.delete('/remove-from-wishlist', auth.isLogin, wishlistController.removeWishlistItem);

module.exports = router;
