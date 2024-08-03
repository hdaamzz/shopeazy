
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

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SUPER_EMAIL,
        pass: process.env.SUPER_PASS
    }, connectionTimeout: 60000
});

const loadMain = async (req, res) => {
    try {
        const category = await Category.find({status:true});
        const product = await Product.find({is_listed:true}).populate('category')
        res.render('userHome', { product ,category});
    } catch (error) {
        console.log(error.message);
    }
}

const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body

        const existingUser = await User.findOne({ email_address: email });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'User already exists' });

        } else {

            const spassword = await securePassword(password);

            const user = {
                user_name: name,
                email_address: email,
                password: spassword,
                is_valid: 1,
                is_block: 0
            };

            const otp = crypto.randomInt(100000, 999999).toString();
            req.session.otpStore = otp;
            req.session.userData = user;
            req.session.otpTime = Date.now();
            console.log(`${req.session.otpStore}`);
            const mailOptions = {
                from: process.env.SUPER_EMAIL,
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}. This OTP is valid for 1 minutes.`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("Error details:", error);
                    res.status(500).json({ success: false, message: 'Error sending email', error: error.message });
                } else {

                    res.status(200).json({ success: true, redirectUrl: `/otpValidate?id=${email}` });

                }
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const loadUserMain = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const cartItems = await Cart.find({ user_id: userData._id })
            const category = await Category.find({status:true});
            const product = await Product.find({is_listed:true}).populate('category')
            res.render('userHome', { userData, product, cartItems ,category});
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

const loadOtp = async (req, res) => {
    try {
        const email = req.query.id;
        res.render("otpform", { email: email, message: "" });
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOtp = async (req, res) => {
    try {
        const otp = req.body['otp'];
        const filterOtp = otp.slice(0, 6);

        if (req.session.otpStore === filterOtp) {
            const userData = new User(req.session.userData);
            await userData.save();

            req.session.otpStore = null;
            req.session.userData = null;
            req.session.user_id = userData._id;
            res.redirect('/home');
        } else {
            const email = req.body['email'];
            res.render('otpform', { email: email, message: "Invalid OTP" });
        }
    } catch (error) {
        console.error('Error in verifyOtp:', error.message);
        res.status(500).send('Server error');
    }
};

const resendOtp = async (req, res) => {
    try {
        const email = req.body['email'];
        const otp = crypto.randomInt(100000, 999999).toString(); // Generate a new 6-digit OTP
        req.session.otpStore = otp;
        req.session.otpTime = Date.now();
        console.log(`${req.session.otpStore}`);
        const mailOptions = {
            from: process.env.SUPER_EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. This OTP is valid for 2 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error.message);
                return res.status(500).send('Error sending email');
            } else {
                res.render('otpform', { email: email, message: "Resended successfully" });
            }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
};

const userLogout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        }
        delete req.session.user_id;
        delete req.user;
        res.redirect('/');
    });
};

const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

const googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect('/');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.session.user_id = user._id;
            return res.redirect('/home');
        });
    })(req, res, next);
};

const checkGoogleAuthStatus = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else if (req.session.user_id) {
        return next();
    }
    res.redirect('/');
};

const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email_address: email ,is_block:false})


        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch && userData.is_valid == 1) {
                req.session.user_id = userData._id;


                res.status(200).json({ success: true });
            } else {
                res.json({ success: false ,msg:"Email or password incorrect"});
            }
        } else {

            res.json({ success: false ,msg :"Shopeazy blocked you"});

        }
    } catch (error) {
        console.log('Error verify signin', error.message);
        res.status(500).send('Internal Server Error');
    }
}

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
            const productData = await Product.find({is_listed: true, category: category });
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

const loadDashboard = async (req, res) => {
    try {

        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }
        if (userData) {
            const userid = userData._id
            const orderData = await Orders.find({user_id:userid}).populate('payment_type').populate('items');
            const cartItems = await Cart.find({ user_id: userid })
            const addressData = await Address.find({ user_id: userid });
            res.render('dashboard', { userData, addressData, cartItems ,orderData})
        } else {
            res.redirect('/')

        }
    } catch (error) {
        console.log('Error Load User Dashboard', error.message);
        res.status(500).send('Internal Server Error');
    }
}



const addUserAddress = async (req, res) => {

    try {
        const { name, phone, address, city, landmark, state, pin, id } = req.body
        const addressData = {
            name: name,
            phone_number: phone,
            address: address,
            town_city: city,
            landmark: landmark,
            pin_code: parseInt(pin),
            state: state,
            user_id: id,
            is_default: false
        };

        const newAddress = new Address(addressData);
        await newAddress.save();

        res.status(200).json({ success: true, message: 'Address added successfully', redirectUrl: '/dashboard' });


    } catch (error) {
        console.log('Error add address', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const updateUserAddress = async (req, res) => {

    try {
        const { name, phone, address, city, landmark, state, pin, id } = req.body

        await Address.findByIdAndUpdate(id, {
            $set: {
                name: name,
                phone_number: phone,
                address: address,
                town_city: city,
                landmark: landmark,
                pin_code: parseInt(pin),
                state: state,
                is_default: false
            }
        });

        res.status(200).json({ success: true, message: 'Address updated successfully', redirectUrl: '/dashboard' });


    } catch (error) {
        console.log('Error Update address', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.body.id;
        await Address.findByIdAndDelete(addressId);

        res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Error deleting address' });
    }
};

const updateUserData = async (req, res) => {
    try {
        const { userName, currentPassword, newPassword } = req.body;
        const userId = req.session.user_id;

        const user = await User.findById(userId);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }


        if (typeof currentPassword !== 'string') {
            return res.json({ success: false, message: 'Current password must be a string' });
        }


        try {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.json({ success: false, message: 'Current password is incorrect' });
            }
        } catch (bcryptError) {
            console.error('bcrypt.compare error:', bcryptError);
            return res.json({ success: false, message: 'Error verifying password' });
        }


        if (newPassword) {
            if (typeof newPassword !== 'string' || newPassword.length < 8) {
                return res.json({ success: false, message: 'New password need at least 8 characters' });
            }

            const spasswords = await securePassword(newPassword);

            await User.findByIdAndUpdate(userId, {
                $set: {
                    user_name: userName,
                    password: spasswords
                }
            });
        } else {

            await User.findByIdAndUpdate(userId, {
                $set: {
                    user_name: userName
                }
            });
        }

        res.json({ success: true, message: 'User information updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating user information' });
    }
}


const loadCart = async (req, res) => {
    try {
        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {

            userData = await User.findById(req.session.user_id);
        }

        if (userData) {
            const userid = userData._id

            const cartItems = await Cart.find({ user_id: userid }).populate('product_id');
            let subtotal = 0;
            cartItems.forEach(item => {
                subtotal += item.product_id.price * item.quantity;
            });
            res.render('cart', { userData, cartItems, subtotal: subtotal.toFixed(2) })


        } else {

            res.redirect('/')
        }
    } catch (error) {
        console.log('Error Load Cart Page', error.message);
        res.status(500).send('Internal Server Error');
    }
}
const loaduserCart = async (req, res) => {
    try {
        res.render('emptycart');

    } catch (error) {
        console.log('Error Load emptyCart Page', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const addCartItem = async (req, res) => {
    try {

        const { productId, quantity, userId } = req.body;


        let cartItem = await Cart.findOne({ user_id: userId, product_id: productId });

        if (cartItem) {

            cartItem.quantity += quantity;
            await cartItem.save();
        } else {

            cartItem = new Cart({
                user_id: userId,
                product_id: productId,
                quantity: quantity
            });
            await cartItem.save();
        }

        res.json({ success: true });

    } catch (error) {
        console.log('Error Add Cart Item', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const updateCartQuantity = async (req, res) => {
    try {
        const { cartItemId, quantity } = req.body;
        await Cart.findByIdAndUpdate(cartItemId, { quantity });
        res.json({ success: true });
    } catch (error) {
        console.log('Error updateCartQuantity ', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const removeCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.body;
        await Cart.findByIdAndDelete(cartItemId);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



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


const loadCheckout = async (req, res) => {
    try {

        let userData;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }
        if (userData) {
            const userid = userData._id
            const cartData = await Cart.find({ user_id: userid }).populate('product_id');
            const addressData = await Address.find({ user_id: userid });
            let subtotal = 0;
            cartData.forEach(item => {
                subtotal += item.product_id.price * item.quantity;
            });
            const paymentTypes = await PaymentType.find({})
            res.render('checkout', { userData, addressData, cartData, subtotal: subtotal.toFixed(2), paymentTypes })
        } else {
            res.redirect('/')

        }
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
}
const placeOrder = async (req, res) => {
    try {
        const { address_id, payment_type, total_amount } = req.body;
        const user_id = req.session.user_id;
        const address = await Address.findById(address_id)
        const cartItems = await Cart.find({ user_id }).populate('product_id');

        const payment_type_objId = await PaymentType.findOne({ pay_type: payment_type });

        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const orderItems = cartItems.map(item => ({
            product_id: item.product_id._id,
            name: item.product_id.product_name,
            quantity: item.quantity,
            price: item.product_id.price,
            total: item.product_id.price * item.quantity
        }));


        const newOrder = new Orders({
            user_id,
            address_id: address,
            items: orderItems,
            total_amount: parseFloat(total_amount),
            payment_type: payment_type_objId._id,
            payment_status: 'Pending',
            order_status: 'Pending',
            shipping_cost: 0,
            tax: 0,
            discount: 0
        });

        await newOrder.save();
        for (let item of cartItems) {
            await Product.findByIdAndUpdate(
                item.product_id._id,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
        }
        await Cart.deleteMany({ user_id });
        res.status(200).json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const loadOrderSummary = async (req, res) => {
    try {
        const orderId = req.query.id;
        const order = await Orders.findById(orderId)
            .populate('user_id')
            
            .populate('items.product_id')  // Changed from 'products.product_id' to 'items.product_id'
            .populate('payment_type');  // Add this if you want to populate payment type

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('ordersummary', { order });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { _id, cancel_reason } = req.body;
        console.log("id:",_id,"reason",cancel_reason);
        await Orders.findByIdAndUpdate(_id, { 
            order_status: 'Cancelled',
            cancellation_reason: cancel_reason
        });

        res.json({ success: true ,message: "Order Cancelled Successfully"});
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
};

module.exports = {
    registerUser,
    loadMain,
    loadUserMain,
    userLogout,
    loadOtp,
    verifyOtp,
    loadProductCategory,
    resendOtp,
    googleAuth,
    googleAuthCallback,
    checkGoogleAuthStatus,
    verifyLogin,
    loadShowProduct,
    loadDashboard,
    addUserAddress,
    updateUserAddress,
    deleteAddress,
    updateUserData,
    loadCart,
    addCartItem,
    updateCartQuantity,
    removeCartItem,
    loaduserCart,
    searchResults,
    loadCheckout,
    placeOrder,
    loadOrderSummary,
    cancelOrder


};

