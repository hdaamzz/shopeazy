
const User = require('../../models/userCredentials');
const Category = require('../../models/categoryList');
const Products = require('../../models/products');
const Address = require('../../models/userAddress');
const Cart = require('../../models/cart');
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

        const product = await Products.find({}).populate('category')
        res.render('userHome', { product });
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

            const product = await Products.find({}).populate('category')
            res.render('userHome', { userData ,product ,cartItems});
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
        const userData = await User.findOne({ email_address: email })


        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch && userData.is_valid == 1) {
                req.session.user_id = userData._id;


                res.status(200).json({ success: true });
            } else {
                res.json({ success: false });
            }
        } else {

            res.json({ success: false });

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
            const productData = await Products.find({ category: category });


            res.render('productCategory', { categoryData, productData, userData ,cartItems})
        } else {
            const category = req.query.id
            const categoryData = await Category.findById(category);
            const productData = await Products.find({ category: category });
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
            const productData = await Products.findById(productId).populate('category');
            const allProductData = await Products.find({ category: productData.category._id })
            res.render('product', { productData, allProductData, userData ,cartItems})


        } else {
            const productId = req.query.id
            const productData = await Products.findById(productId).populate('category');
            const allProductData = await Products.find({ category: productData.category._id })
            res.render('product', { productData, allProductData })
        }
    } catch (error) {
        console.log('Error Load Product Category', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const loadDashboard =async(req,res)=>{
     try {

        let userData ;
        if (req.user) {
            userData = req.user;
        } else if (req.session.user_id) {
            userData = await User.findById(req.session.user_id);
        }
        if (userData) {
            const userid= userData._id
            const cartItems = await Cart.find({ user_id: userid })
            const addressData = await Address.find({user_id:userid});
            res.render('dashboard',{ userData,addressData ,cartItems})
         } else {
            res.redirect('/')

        }
    } catch (error) {
        console.log('Error Load User Dashboard', error.message);
        res.status(500).send('Internal Server Error');
    }
}



const addUserAddress=async(req,res)=>{

    try {
        const {name,phone,address,city,landmark,state,pin,id} =req.body
        const addressData = {
            name: name,
            phone_number: phone,
            address: address,
            town_city: city,
            landmark:landmark,
            pin_code: parseInt(pin),
            state: state,
            user_id:id,
            is_default:false
        };

        const newAddress = new Address(addressData);
        await newAddress.save();

        res.status(200).json({ success: true, message: 'Address added successfully', redirectUrl: '/dashboard' });

        
    } catch (error) {
        console.log('Error add address', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const updateUserAddress=async(req,res)=>{

    try {
        const {name,phone,address,city,landmark,state,pin,id} =req.body

        await Address.findByIdAndUpdate(id, {
            $set: {
                name: name,
                phone_number: phone,
                address: address,
                town_city: city,
                landmark:landmark,
                pin_code: parseInt(pin),
                state: state,
                is_default:false
            }
        });

        res.status(200).json({ success: true, message: 'Address updated successfully', redirectUrl: '/dashboard' });

        
    } catch (error) {
        console.log('Error Update address', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const deleteAddress= async (req, res) => {
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
            const userid= userData._id
            
            const cartItems = await Cart.find({ user_id: userid }).populate('product_id');
            let subtotal = 0;
            cartItems.forEach(item => {
            subtotal += item.product_id.price * item.quantity;
            });
            res.render('cart', { userData ,cartItems , subtotal:subtotal.toFixed(2)})


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

const addCartItem=async(req,res)=>{
    try {

        const { productId, quantity ,userId } = req.body;
        console.log(productId,quantity,userId);
        
    
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

const updateCartQuantity=async(req,res)=>{
    try {
        const { cartItemId, quantity } = req.body;
    await Cart.findByIdAndUpdate(cartItemId, { quantity });
    res.json({ success: true });
    } catch (error) {
        console.log('Error updateCartQuantity ', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const removeCartItem= async (req, res) => {
    try {
      const { cartItemId } = req.body;
      await Cart.findByIdAndDelete(cartItemId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
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
    loaduserCart


};

