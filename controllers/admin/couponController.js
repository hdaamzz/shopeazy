const Coupon = require('../../models/admin/coupons');
const { HTTP_STATUS } = require('../../utils/constants');

const loadCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { couponId: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // Build sort object
    const sortObject = { [sortBy]: sortOrder };

    // Fetch coupons with pagination and search
    const coupons = await Coupon.find(searchQuery)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCoupons = await Coupon.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalCoupons / limit);

    res.render('coupon', {
      coupons,
      currentPage: page,
      totalPages,
      totalCoupons,
      limit,
      search,
      sortBy,
      sortOrder: req.query.sortOrder || 'desc'
    });
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

    // Check for duplicate coupon ID
    const existingCoupon = await Coupon.findOne({ couponId });
    if (existingCoupon) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Coupon ID already exists'
      });
    }

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

    // Check for duplicate coupon ID (excluding current coupon)
    const existingCoupon = await Coupon.findOne({ 
      couponId, 
      _id: { $ne: id } 
    });
    
    if (existingCoupon) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Coupon ID already exists'
      });
    }

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
