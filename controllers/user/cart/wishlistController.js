const { HTTP_STATUS } = require('../../../utils/constants');
const User = require('../../../models/user/userCredentials');
const Wishlist = require('../../../models/user/userwhishlist');
const { getAuthenticatedUser } = require('../../../helpers/userHelper');

const ITEMS_PER_PAGE = 5; // Number of items per page

const loadWishlist = async (req, res) => {
  try {
    const userData = await getAuthenticatedUser(req);
    if (!userData) return res.redirect('/');

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    // Get total count of wishlist items
    const totalWishlistItems = await Wishlist.countDocuments({ user_id: userData._id });
    const totalPages = Math.ceil(totalWishlistItems / limit);

    // Get paginated wishlist items
    const wishlistItems = await Wishlist.find({ user_id: userData._id })
      .populate('product_id')
      .skip(skip)
      .limit(limit);

    res.render('wishlist', { 
      userData, 
      wishlist: wishlistItems,
      currentPage: page,
      totalPages: totalPages,
      totalWishlistItems: totalWishlistItems
    });
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
