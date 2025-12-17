const { HTTP_STATUS } = require('../../../utils/constants');
const User = require('../../../models/user/userCredentials');
const Wishlist = require('../../../models/user/userwhishlist');
const { getAuthenticatedUser } = require('../../../helpers/userHelper');


const loadWishlist = async (req, res) => {
  try {
    const userData = await getAuthenticatedUser(req);
    if (!userData) return res.redirect('/');

    const wishlistItems = await Wishlist.find({ user_id: userData._id }).populate(
      'product_id'
    );

    res.render('wishlist', { userData, wishlist: wishlistItems });
  } catch (error) {
    console.error('Error loading wishlist:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Internal Server Error');
  }
};

const addWishlistItem = async (req, res) => {
  try {
    const { productId, userId } = req.body;

    const existingWishlistItem = await Wishlist.findOne({
      user_id: userId,
      product_id: productId
    });

    if (existingWishlistItem) {
      return res.json({
        success: false,
        message: 'This product is already in wishlist'
      });
    }

    const newWishlistItem = new Wishlist({
      user_id: userId,
      product_id: productId
    });

    await newWishlistItem.save();

    res.json({ success: true, message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Error adding wishlist item:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to add item to wishlist'
    });
  }
};

const removeWishlistItem = async (req, res) => {
  try {
    const { cartItemId } = req.body;

    await Wishlist.findByIdAndDelete(cartItemId);

    res.json({ success: true, message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to remove item from wishlist'
    });
  }
};

module.exports = {
  loadWishlist,
  addWishlistItem,
  removeWishlistItem
};
