const { HTTP_STATUS } = require('../../utils/constants');
const Orders = require('../../models/user/userOrders');
const {
  ORDER_STATUS,
  getTimeFrameMatchStage,
  buildTimeFrameQuery,
  getGroupingFormat
} = require('../../helpers/analyticsHelper');


const getOrderStatusCounts = async (timeFrame) => {
  try {
    const matchStage = getTimeFrameMatchStage(timeFrame);

    const result = await Orders.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.status',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          delivered: {
            $sum: {
              $cond: [{ $eq: ['$_id', ORDER_STATUS.DELIVERED] }, '$count', 0]
            }
          },
          canceled: {
            $sum: {
              $cond: [{ $eq: ['$_id', ORDER_STATUS.CANCELLED] }, '$count', 0]
            }
          },
          returned: {
            $sum: {
              $cond: [{ $eq: ['$_id', ORDER_STATUS.RETURNED] }, '$count', 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          delivered: 1,
          canceled: 1,
          returned: 1
        }
      }
    ]);

    return result[0] || { delivered: 0, canceled: 0, returned: 0 };
  } catch (error) {
    console.error('Error getting order status counts:', error);
    return { delivered: 0, canceled: 0, returned: 0 };
  }
};

const getSalesData = async (timeFrame) => {
  try {
    const query = buildTimeFrameQuery(timeFrame);
    const groupingFormat = getGroupingFormat(timeFrame);

    const result = await Orders.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: groupingFormat, date: '$created_at' }
          },
          totalSales: { $sum: '$total_amount' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $group: {
          _id: null,
          labels: { $push: '$_id' },
          values: { $push: '$totalSales' }
        }
      },
      {
        $project: {
          _id: 0,
          labels: 1,
          values: 1
        }
      }
    ]);

    return result[0] || { labels: [], values: [] };
  } catch (error) {
    console.error('Error getting sales data:', error);
    return { labels: [], values: [] };
  }
};

const getBestSellingProducts = async (timeFrame) => {
  try {
    const matchStage = getTimeFrameMatchStage(timeFrame);

    return await Orders.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_id',
          name: { $first: '$items.name' },
          sales: { $sum: '$items.quantity' }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: 1,
          sales: 1
        }
      }
    ]);
  } catch (error) {
    console.error('Error getting best selling products:', error);
    return [];
  }
};

const getBestSellingCategories = async (timeFrame) => {
  try {
    const matchStage = getTimeFrameMatchStage(timeFrame);

    return await Orders.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          name: { $first: '$category.category_name' },
          sales: { $sum: '$items.quantity' }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: 1,
          sales: 1
        }
      }
    ]);
  } catch (error) {
    console.error('Error getting best selling categories:', error);
    return [];
  }
};

const loadDashboard = async (req, res) => {
  try {
    const { timeFrame } = req.query;

    const [orderStatusCounts, salesData, bestSellingProducts, bestSellingCategories] =
      await Promise.all([
        getOrderStatusCounts(timeFrame),
        getSalesData(timeFrame),
        getBestSellingProducts(timeFrame),
        getBestSellingCategories(timeFrame)
      ]);

    res.render('dashboard', {
      orderStatusData: orderStatusCounts,
      salesData,
      bestSellingProducts,
      bestSellingCategories,
      timeFrame
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while loading dashboard'
    });
  }
};

module.exports = {
  loadDashboard
};
