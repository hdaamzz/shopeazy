const User = require('../../models/user/userCredentials');
const Product = require('../../models/admin/products');
const Address = require('../../models/user/userAddress');
const Cart = require('../../models/user/cart');
const Orders = require('../../models/user/userOrders');
const bcrypt = require('bcrypt');
const Wallet = require('../../models/user/userwallet')
require('dotenv').config();


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
            const [orderData, cartItems, addressData] = await Promise.all([
                Orders.find({ user_id: userid }).populate('payment_type').populate('items'),
                Cart.find({ user_id: userid }),
                Address.find({ user_id: userid })
              ]);
              
            res.render('dashboard', { userData, addressData, cartItems, orderData })
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


const cancelOrder = async (req, res) => {
    try {
        const { _id, cancel_reason } = req.body;
       

        const order = await Orders.findById(_id).populate('payment_type');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        if(order.payment_type.pay_type == "UPI PAYMENT"){
            const randomID = Math.floor(100000 + Math.random() * 900000);
            const refundAmount = parseFloat(order.total_amount);

           
            let wallet = await Wallet.findOne({ user_id: req.session.user_id });
            
            if (wallet) {
               
                wallet.balance += refundAmount;
                wallet.history.push({
                    amount: refundAmount,
                    transaction_type: "Cancelled",
                    description: "Product Cancelled Refund",
                    transaction_id: `TRX-${randomID}`
                });
            } else {
                // Create new wallet
                wallet = new Wallet({
                    user_id: req.session.user_id,
                    balance: refundAmount,
                    history: [{
                        amount: refundAmount,
                        transaction_type: "Cancelled",
                        description: "Product Cancelling Refund",
                        transaction_id: `TRX-${randomID}`
                    }]
                });
            }

            await wallet.save();

            order.order_status = 'Cancelled';
            order.cancellation_reason = cancel_reason;
            await order.save();
        } else {
            order.order_status = 'Cancelled';
            order.cancellation_reason = cancel_reason;
            await order.save();
        }

        // Update product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product_id,
                { $inc: { stock: item.quantity } },
                { new: true }
            );
        }

        res.json({ success: true, message: "Order Cancelled Successfully and Stock Updated" });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
};












module.exports = {
    loadDashboard,
    addUserAddress,
    updateUserAddress,
    deleteAddress,
    updateUserData,
    cancelOrder
};