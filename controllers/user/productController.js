const User = require('../../models/userCredentials');
const Category = require('../../models/categoryList');
const Product = require('../../models/products');
const Address = require('../../models/userAddress');
const Cart = require('../../models/cart');
const PaymentType = require('../../models/paymentType');
const Orders = require('../../models/userOrders');
const bcrypt = require('bcrypt');
require('dotenv').config();
const nodemailer = require('nodemailer');
const passport = require('passport');
const crypto = require('crypto');
const path = require('path');
const Razorpay = require('razorpay');


const loadShop = async (req, res) => {
    try {
        const { sort } = req.query; 

        let sortOptions = {};
        switch (sort) {
            case 'name_asc':
                sortOptions = { product_name: 1 };
                break;
            case 'name_desc':
                sortOptions = { product_name: -1 };
                break;
            case 'price_asc':
                sortOptions = { price: 1 };
                break;
            case 'price_desc':
                sortOptions = { price: -1 };
                break;
            default:
                sortOptions = { product_name: 1 }; 
        }

        const [allProducts, category] = await Promise.all([
            Product.find({ is_listed: true }).sort(sortOptions),
            Category.find({ status: true })
        ]);

        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }

        res.render('shop', { product: allProducts, category, userData, sort: sort || '' });

    } catch (error) {
        console.error('Error loading shop:', error);
        res.status(500).render('error', { message: 'Failed to load shop' });
    }
};

const loadProductCategory = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const category = req.query.id
            const cartItems = await Cart.find({ user_id: userData._id })
            const categoryData = await Category.findById(category);
            const productData = await Product.find({ is_listed: true, category: category });


            res.render('productCategory', { categoryData, productData, userData, cartItems })
        } else {
            const category = req.query.id
            const categoryData = await Category.findById(category);
            const productData = await Product.find({ is_listed: true, category: category });
            res.render('productCategory', { categoryData, productData })
        }



    } catch (error) {
        console.log('Error Load Product Category', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const loadShowProduct = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const productId = req.query.id
            const cartItems = await Cart.find({ user_id: userData._id })
            const productData = await Product.findById(productId).populate('category');
            const allProductData = await Product.find({ category: productData.category._id })
            res.render('product', { productData, allProductData, userData, cartItems })


        } else {
            const productId = req.query.id
            const productData = await Product.findById(productId).populate('category');
            const allProductData = await Product.find({ category: productData.category._id })
            res.render('product', { productData, allProductData })
        }
    } catch (error) {
        console.log('Error Load Product Category', error.message);
        res.status(500).send('Internal Server Error');
    }
}












module.exports = {
    loadShowProduct,
    loadShop,
    loadProductCategory
};