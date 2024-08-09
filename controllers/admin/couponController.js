const Coupon = require('../../models/coupons');

const loadCoupon = async(req,res)=>{
    try {

        const coupons = await Coupon.find({})
        res.render('coupon',{coupons})
    } catch (error) {
        
    }
}


const addCoupon = async (req, res) => {
    try {
        const { 
            couponId, 
            discount, 
            description, 
            expiryDate, 
            min_purchase_amount, 
            max_amount, 
            is_active 
        } = req.body;

        const newCoupon = new Coupon({
            couponId,
            discount,
            description,
            expiryDate,
            min_purchase_amount,
            max_amount,
            is_active
        });

        await newCoupon.save();

        res.status(201).json({ 
            success: true, 
            message: 'Coupon added successfully', 
            redirectUrl: '/admin/coupons'
        });

    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while adding the coupon'
        });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const {id, couponId, discount, description, expiryDate, min_purchase_amount, max_amount, is_active } = req.body;

        const updatedCoupon = await Coupon.findOneAndUpdate(
            { _id:id  },
            {
                $set: {
                    couponId,
                    discount,
                    description,
                    expiryDate,
                    min_purchase_amount,
                    max_amount,
                    is_active
                }
            },
            { new: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        res.status(200).json({ success: true, message: 'Coupon updated successfully', redirectUrl: '/admin/coupons' });

    } catch (error) {
        console.log('Error updating coupon:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.body.id;
        await Coupon.findByIdAndDelete(couponId);

        res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ success: false, message: 'Error deleting offer' });
    }
};

module.exports = {
    loadCoupon,
    addCoupon,
    updateCoupon,
    deleteCoupon
}