const { HTTP_STATUS } = require('../../../utils/constants');
const User = require('../../../models/user/userCredentials');
const Product = require('../../../models/admin/products');
require('dotenv').config();

const getUserFromRequest = async (req) => {
  if (req.user) return req.user;
  if (req.session.user_id) return User.findById(req.session.user_id);
  return null;
};

const buildSortOptions = (sort) => {
  switch (sort) {
    case 'name_asc':
      return { product_name: 1 };
    case 'name_desc':
      return { product_name: -1 };
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    default:
      return { product_name: 1 };
  }
};

const searchResults = async (req, res) => {
  try {
    const { q: query, sort } = req.query;

    const searchCriteria = {};
    if (query) {
      searchCriteria.$or = [
        { product_name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    const sortOptions = buildSortOptions(sort);
    const userData = await getUserFromRequest(req);

    const productsQuery = Product.find(searchCriteria).sort(sortOptions).populate('category');
    const products = await productsQuery;

    if (userData) {
      return res.render('search-results', { userData, products, query, sort });
    }

    res.render('search-results', { products, query, sort });
  } catch (error) {
    console.error(error);
    res.status(HTTP_STATUS.SERVER_ERROR).render('error', { message: 'Server error' });
  }
};

const shopFilter = async (req, res) => {
  try {
    const { sort } = req.query;
    const sortOptions = buildSortOptions(sort);
    const userData = await getUserFromRequest(req);
    const products = await Product.find().sort(sortOptions);

    res.render('user/shop', { userData, products, sort: sort || '' });
  } catch (error) {
    console.error(error);
    res.status(HTTP_STATUS.SERVER_ERROR).render('error', { message: 'Server error' });
  }
};

module.exports = {
  searchResults,
  shopFilter
};
