const { HTTP_STATUS } = require('../../../utils/constants');
const Address = require('../../../models/user/userAddress');

const addUserAddress = async (req, res) => {
  try {
    const { name, phone, address, city, landmark, state, pin, id } = req.body;

    const newAddress = new Address({
      name,
      phone_number: phone,
      address,
      town_city: city,
      landmark,
      pin_code: parseInt(pin),
      state,
      user_id: id,
      is_default: false
    });

    await newAddress.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Address added successfully',
      redirectUrl: '/dashboard'
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to add address'
    });
  }
};

const updateUserAddress = async (req, res) => {
  try {
    const { name, phone, address, city, landmark, state, pin, id } = req.body;

    await Address.findByIdAndUpdate(id, {
      $set: {
        name,
        phone_number: phone,
        address,
        town_city: city,
        landmark,
        pin_code: parseInt(pin),
        state,
        is_default: false
      }
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Address updated successfully',
      redirectUrl: '/dashboard'
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update address'
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id } = req.body;

    await Address.findByIdAndDelete(id);

    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete address'
    });
  }
};

module.exports = {
  addUserAddress,
  updateUserAddress,
  deleteAddress
};
