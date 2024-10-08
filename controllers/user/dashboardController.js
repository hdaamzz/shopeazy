const User = require('../../models/user/userCredentials');
const Product = require('../../models/admin/products');
const Address = require('../../models/user/userAddress');
const Cart = require('../../models/user/cart');
const Orders = require('../../models/user/userOrders');
const bcrypt = require('bcrypt');
const Wallet = require('../../models/user/userwallet')
const ReturnRequest= require('../../models/user/returnRequest');
const PDFDocument = require('pdfkit');
const fs = require('fs');
require('dotenv').config();
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
async function createRazorpayOrder(order, amount) {
    return await razorpay.orders.create({
        amount: Math.round(parseFloat(amount) * 100),
        currency: "INR",
        receipt: order._id.toString(),
        payment_capture: 1
    });
}

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
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
            const [orderData, cartItems, addressData] = await Promise.all([
                Orders.find({ user_id: userid }).populate('payment_type').populate('items').populate('items.product_id').sort({created_at:-1}),
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
        console.log(userName, currentPassword, newPassword);
        
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

            const hashedPassword = await securePassword(newPassword);

            await User.findByIdAndUpdate(userId, {
                password: hashedPassword,
                user_name: userName,
            });
        } else {
            await User.findByIdAndUpdate(userId, {
                user_name: userName,
            });
        }

        res.json({ success: true, message: 'User information updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating user information' });
    }
};


const cancelOrder = async (req, res) => {
    try {
        const { _id, cancel_reason,item_id } = req.body;
       

        const order = await Orders.findById(_id).populate('payment_type').populate('items.product_id');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const products = order.items.find(product=>product._id.equals(item_id))
        
        if(order.payment_type.pay_type == "UPI PAYMENT" && order.payment_status == 'Completed'){
            const randomID = Math.floor(100000 + Math.random() * 900000);
            const refundAmount = parseFloat(products.total);

           
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

            products.status = 'Cancelled';
            products.cancellation_reason = cancel_reason;
            await order.save();
        } else {
            products.status = 'Cancelled';
            products.cancellation_reason = cancel_reason;
            await order.save();
        }

       
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


const returnOrder = async (req, res) => {
    try {
        const { order_id, return_reason ,item_id} = req.body;
        
        

        const order = await Orders.findById(order_id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const products = order.items.find(product=>product._id.equals(item_id))
        if (products.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Only delivered orders can be returned' });
        }

        
       
        const returnRequest = new ReturnRequest({
            item_id:products._id,
            order_id: order._id,
            user_id: req.session.user_id,
            reason: return_reason,
            status: 'Pending'
        });

        await returnRequest.save();

       
        products.status = 'Return Requested';
        await order.save();

        res.json({ success: true, message: "Return request submitted successfully" });
    } catch (error) {
        console.error('Error submitting return request:', error);
        res.status(500).json({ success: false, message: 'Failed to submit return request' });
    }
};




const downloadInvoice = async (req, res) => {
    try {
      const orderId = req.query.orderId;
      const itemId = req.query.itemId;
  
      const order = await Orders.findOne({ order_id: orderId }).populate('items.product_id');
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
      const product = order.items.find(item => item._id.equals(itemId));
      if (!product) {
        return res.status(404).send('Item not found');
      }
  
      const doc = new PDFDocument({ margin: 50 });
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.order_id}.pdf`);
  
      doc.pipe(res);
  
     
      doc.fontSize(20).text('ShopEazy', { align: 'right' });
      doc.moveDown();
  
     
      doc.fontSize(18).text('Invoice', { align: 'center' });
      doc.moveDown();
  
      
      doc.fontSize(10);
      doc.text(`Invoice Number: INV-${order._id.toString().slice(-6)}`, { align: 'left' });
      doc.text(`Order ID: ${order.order_id}`, { align: 'left' });
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, { align: 'left' });
      doc.moveDown();
  
    
      doc.text('Ship to:', { align: 'left' });
      doc.text(`${order.address_id.name}`, { align: 'left' });
      doc.text(`${order.address_id.address}`, { align: 'left' });
      doc.text(`${order.address_id.town_city}, ${order.address_id.state} - ${order.address_id.pin_code}`, { align: 'left' });
      doc.moveDown();
  
     
      const table = {
        headers: ['Product', 'Quantity', 'Price', 'Total'],
        rows: [
          [product.name, product.quantity.toString(), `${product.price.toFixed(2)}`, `${product.total.toFixed(2)}`]
        ]
      };
  
      const startX = 50;
      const startY = 300;
      const rowHeight = 30;
      const colWidth = (doc.page.width - 100) / 4;
  
    
      doc.font('Helvetica-Bold');
      table.headers.forEach((header, i) => {
        doc.text(header, startX + i * colWidth, startY, { width: colWidth, align: 'left' });
      });
  
    
      doc.font('Helvetica');
      table.rows.forEach((row, i) => {
        const y = startY + (i + 1) * rowHeight;
        row.forEach((cell, j) => {
          doc.text(cell, startX + j * colWidth, y, { width: colWidth, align: 'left' });
        });
      });
  
      
      const totalY = startY + (table.rows.length + 1) * rowHeight + 20;
      doc.text(`Subtotal: ${product.total.toFixed(2)}`, { align: 'right' });
      doc.text(`Shipping: ${order.shipping_cost.toFixed(2)}`, { align: 'right' });
      doc.text(`Tax: ${order.tax.toFixed(2)}`, { align: 'right' });
      doc.text(`Discount: ${order.discount.toFixed(2)}`, { align: 'right' });
      doc.font('Helvetica-Bold');
      doc.text(`Total: ${(product.total + order.shipping_cost + order.tax - order.discount).toFixed(2)}`, { align: 'right' });
  
      doc.end();
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).send('Error generating invoice');
    }
  };


  const initiateRepayment = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        
        const order = await Orders.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.payment_status !== 'Failed' && order.payment_status !== 'Processing' ) {
            return res.status(400).json({ success: false, message: 'This order does not require repayment' });
        }

        const razorpayOrder = await createRazorpayOrder(order, amount);
        order.razorpay_order_id = razorpayOrder.id;
        await order.save();

        res.status(200).json({ 
            success: true, 
            key: process.env.RAZORPAY_KEY_ID,
            message: 'Repayment initiated successfully', 
            orderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });
    } catch (error) {
        console.error('Error in initiateRepayment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};






module.exports = {
    loadDashboard,
    addUserAddress,
    updateUserAddress,
    deleteAddress,
    updateUserData,
    cancelOrder,
    returnOrder,
    downloadInvoice,
    initiateRepayment
};