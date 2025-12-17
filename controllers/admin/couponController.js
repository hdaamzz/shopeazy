const Coupon = require('../../models/admin/coupons');
const { HTTP_STATUS } = require('../../utils/constants');


const loadCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.render('coupon', { coupons });
  } catch (error) {
    console.error('Error loading coupons:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading coupons'
    });
  }
};

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

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Coupon added successfully',
      redirectUrl: '/admin/coupons'
    });
  } catch (error) {
    console.error('Error adding coupon:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while adding coupon'
    });
  }
};


const updateCoupon = async (req, res) => {
  try {
    const {
      id,
      couponId,
      discount,
      description,
      expiryDate,
      min_purchase_amount,
      max_amount,
      is_active
    } = req.body;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
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
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Coupon updated successfully',
      redirectUrl: '/admin/coupons'
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while updating coupon'
    });
  }
};


const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.body;

    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while deleting coupon'
    });
  }
};

module.exports = {
  loadCoupons,
  addCoupon,
  updateCoupon,
  deleteCoupon
};
