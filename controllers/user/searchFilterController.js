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



const searchResults = async (req, res) => {
    try {
        const { q: query, sort } = req.query;


        // Build the search criteria
        const searchCriteria = {};
        if (query) {
            searchCriteria.$or = [
                { product_name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }



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
            case 'date_desc':
                sortOptions = { added_date: -1 };
                break;
            case 'date_asc':
                sortOptions = { added_date: 1 };
                break;
            default:
                sortOptions = { product_name: 1 };
        }
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const products = await Product.find(searchCriteria).sort(sortOptions);

            res.render('search-results', { userData, products, query, sort });

        } else {

            const products = await Product.find(searchCriteria).sort(sortOptions);

            res.render('search-results', { products, query, sort });
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

const shopFilter = async (req, res) => {
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

        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }

        const products = await Product.find().sort(sortOptions);

       
        res.render('user/shop', { userData, products, sort: sort || '' });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};










module.exports = {

    searchResults,
    shopFilter


};