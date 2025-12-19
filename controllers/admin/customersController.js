const User = require('../../models/user/userCredentials');
const { HTTP_STATUS, VALID_USER } = require('../../utils/constants');

const loadAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; 
    const skip = (page - 1) * limit;

    const totalCustomers = await User.countDocuments({ is_valid: VALID_USER });
    const totalPages = Math.ceil(totalCustomers / limit);

    const customers = await User.find({ is_valid: VALID_USER })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); 

    res.render('allcustomer', {
      users: customers,
      currentPage: page,
      totalPages: totalPages,
      totalCustomers: totalCustomers
    });
  } catch (error) {
    console.error('Error loading customers:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading customers'
    });
  }
};

const toggleUserBlockStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    user.is_block = !user.is_block;
    await user.save();

    const message = user.is_block
      ? 'User blocked successfully'
      : 'User unblocked successfully';

    res.json({ success: true, message, isBlocked: user.is_block });
  } catch (error) {
    console.error('Error toggling user block status:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while updating user status'
    });
  }
};

module.exports = {
  loadAllCustomers,
  toggleUserBlockStatus
};
