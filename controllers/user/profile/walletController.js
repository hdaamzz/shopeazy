const { HTTP_STATUS } = require('../../../utils/constants');
const Wallet = require('../../../models/user/userwallet');
const User = require('../../../models/user/userCredentials');
const mongoose = require('mongoose');
const crypto = require('crypto');

const loadWallet = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect('/');

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [walletData, userData] = await Promise.all([
      Wallet.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
        { $unwind: '$history' },
        { $sort: { 'history.date': -1 } },
        {
          $facet: {
            transactions: [
              { $skip: skip },
              { $limit: limit },
              {
                $group: {
                  _id: '$_id',
                  user_id: { $first: '$user_id' },
                  balance: { $first: '$balance' },
                  history: { $push: '$history' }
                }
              }
            ],
            totalCount: [{ $count: 'count' }],
            walletInfo: [
              {
                $group: {
                  _id: '$_id',
                  user_id: { $first: '$user_id' },
                  balance: { $first: '$balance' }
                }
              },
              { $limit: 1 }
            ]
          }
        },
        {
          $project: {
            wallet: {
              $cond: {
                if: { $gt: [{ $size: '$transactions' }, 0] },
                then: { $arrayElemAt: ['$transactions', 0] },
                else: { $arrayElemAt: ['$walletInfo', 0] }
              }
            },
            totalTransactions: {
              $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0]
            }
          }
        }
      ]),
      User.findById(userId)
    ]);

    const wallet = walletData[0]?.wallet || { balance: 0, history: [] };
    const totalTransactions = walletData[0]?.totalTransactions || 0;
    const totalPages = Math.ceil(totalTransactions / limit);

    res.render('wallet', {
      wallet: [wallet],
      user: userData,
      currentPage: page,
      totalPages,
      totalTransactions
    });
  } catch (error) {
    console.error(error.message);
    res.status(HTTP_STATUS.SERVER_ERROR).send('Server error');
  }
};

const withdrawFunds = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const { amount, bankAccount, ifscCode, accountName } = req.body;

    if (!amount || !bankAccount || !ifscCode || !accountName) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid withdrawal amount'
      });
    }

    if (withdrawAmount < 100) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹100'
      });
    }

    const wallet = await Wallet.findOne({ user_id: userId });

    if (!wallet) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.balance < withdrawAmount) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    const transactionId = `TRX-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const transaction = {
      amount: withdrawAmount,
      date: new Date(),
      transaction_type: 'Withdrawal',
      description: `Withdrawal to ${bankAccount} (${ifscCode})`,
      transaction_id: transactionId
    };

    wallet.balance -= withdrawAmount;
    wallet.history.push(transaction);

    await wallet.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Withdrawal processed successfully',
      transactionId: transactionId,
      newBalance: wallet.balance
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message
    });
  }
};

module.exports = {
  loadWallet,
  withdrawFunds
};
