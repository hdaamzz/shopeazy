const { HTTP_STATUS } = require('../../../utils/constants');
const mongoose = require('mongoose');
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

const loadShop = async (req, res) => {
  try {
    const { sort, category: selectedCategories } = req.query;
    const sortOptions = buildSortOptions(sort);

    const matchStage = { is_listed: true };
    if (selectedCategories) {
      const categoryIds = selectedCategories
        .split(',')
        .map((id) => new mongoose.Types.ObjectId(id));
      matchStage.category = { $in: categoryIds };
    }

    const [allProducts, categories, offers, userData] = await Promise.all([
      Product.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryDetails'
          }
        },
        { $unwind: '$categoryDetails' },
        { $match: { 'categoryDetails.status': true } },
        { $sort: sortOptions }
      ]),
      Category.find({ status: true }),
      Offer.find({ status: 'active' }).populate('products').populate('category'),
      getUserFromRequest(req)
    ]);

    res.render('shop', {
      product: allProducts,
      categories,
      userData,
      offers,
      sort: sort || '',
      selectedCategories: selectedCategories || ''
    });
  } catch (error) {
    console.error('Error loading shop:', error);
    res.status(HTTP_STATUS.NOT_FOUND).render('404', { message: 'Failed to load shop' });
  }
};

const loadProductCategory = async (req, res) => {
  try {
    const userData = await getUserFromRequest(req);
    const categoryId = req.query.id;

    const [categoryData, productData, offers] = await Promise.all([
      Category.findById(categoryId),
      Product.find({ is_listed: true, category: categoryId }).populate('category'),
      Offer.find({
        status: 'active',
        $or: [{ type: 'PRODUCT' }, { type: 'CATEGORY' }]
      })
        .populate('products')
        .populate('category')
    ]);

    if (userData) {
      const cartItems = await Cart.find({ user_id: userData._id });
      return res.render('productCategory', {
        categoryData,
        productData,
        userData,
        cartItems,
        offers
      });
    }

    res.render('productCategory', { categoryData, productData, offers });
  } catch (error) {
    console.error('Error Load Product Category', error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Internal Server Error');
  }
};

const loadShowProduct = async (req, res) => {
  try {
    const userData = await getUserFromRequest(req);
    const productId = req.query.id;

    const productData = await Product.findById(productId).populate('category');
    const allProductData = await Product.find({ category: productData.category._id });

    const offers = await Offer.find({
      status: 'active',
      $or: [
        { type: 'PRODUCT' },
        { type: 'CATEGORY', category: productData.category._id }
      ]
    })
      .populate('products')
      .populate('category');

    if (userData) {
      const cartItems = await Cart.find({ user_id: userData._id });
      return res.render('product', {
        productData,
        allProductData,
        userData,
        cartItems,
        offers
      });
    }

    res.render('product', { productData, allProductData, offers });
  } catch (error) {
    console.error('Error Load Product Category', error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Internal Server Error');
  }
};

module.exports = {
  loadShowProduct,
  loadShop,
  loadProductCategory
};
