const { HTTP_STATUS } = require('../../../utils/constants');
const User = require('../../../models/user/userCredentials');
const Category = require('../../../models/admin/categoryList');
const Product = require('../../../models/admin/products');
const Cart = require('../../../models/user/cart');
const Offer = require('../../../models/admin/offers');
require('dotenv').config();

const getUserFromRequest = async (req) => {
  if (req.user) return req.user;
  if (req.session.user_id) return User.findById(req.session.user_id);
  return null;
};

const getCommonHomeData = () =>
  Promise.all([
    Category.find({ status: true }),
    Product.aggregate([
      { $match: { is_listed: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $match: { 'category.status': true } },
      { $sort: { added_date: -1 } }
    ]),
    Offer.find({ status: 'active' }).populate('products').populate('category')
  ]);

const loadMain = async (req, res) => {
  try {
    const [category, product, offers] = await getCommonHomeData();
    res.render('userHome', { product, category, offers });
  } catch (error) {
    console.error(error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

const loadUserMain = async (req, res) => {
  try {
    const userData = await getUserFromRequest(req);
    if (!userData) return res.redirect('/');

    const [cartItems, category, product, offers] = await Promise.all([
      Cart.find({ user_id: userData._id }),
      ...await getCommonHomeData()
    ]);
    res.render('userHome', { userData, product, cartItems, category, offers });
  } catch (error) {
    console.error(error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

const checkGoogleAuthStatus = (req, res, next) => {
  if (req.isAuthenticated() || req.session.user_id) return next();
  res.redirect('/');
};

module.exports = {
  loadMain,
  loadUserMain,
  checkGoogleAuthStatus
};
