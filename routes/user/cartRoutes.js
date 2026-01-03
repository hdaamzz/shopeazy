const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/user/cart/cartController');
const wishlistController = require('../../controllers/user/cart/wishlistController');
const auth = require('../../middleware/userAuth');

router.get('/cart', auth.isLogin, cartController.loadCart);
router.get('/cart/empty', auth.isLogout, cartController.loadUserCart);
router.post('/cart/add', auth.isLogin, cartController.addCartItem);
router.post('/cart/wishlist/add', auth.isLogin, cartController.moveWishlistToCart);
router.patch('/cart/update', auth.isLogin, cartController.updateCartQuantity);
router.delete('/cart/remove', auth.isLogin, cartController.removeCartItem);

router.get('/wishlist', auth.isLogin, wishlistController.loadWishlist);
router.post('/wishlist/add', auth.isLogin, wishlistController.addWishlistItem);
router.delete('/wishlist/remove', auth.isLogin, wishlistController.removeWishlistItem);

module.exports = router;
