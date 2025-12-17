const { HTTP_STATUS } = require('../../../utils/constants');
const Wallet = require('../../../models/user/userwallet');
const User = require('../../../models/user/userCredentials');
const mongoose = require('mongoose');

const loadWallet = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect('/');

    const [walletData, userData] = await Promise.all([
      Wallet.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
        { $unwind: '$history' },
        { $sort: { 'history.date': -1 } },
        {
          $group: {
            _id: '$_id',
            user_id: { $first: '$user_id' },
            balance: { $first: '$balance' },
            history: { $push: '$history' }
          }
        }
      ]),
      User.findById(userId)
    ]);

    res.render('wallet', { wallet: walletData, user: userData });
  } catch (error) {
    console.error(error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

module.exports = {
  loadWallet
};
