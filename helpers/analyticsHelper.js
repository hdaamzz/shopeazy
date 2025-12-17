const Orders = require('../models/user/userOrders');

const TIME_FRAMES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

const ORDER_STATUS = {
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned'
};

const getTimeFrameMatchStage = (timeFrame) => {
  const now = new Date();
  let startDate;

  switch (timeFrame) {
    case TIME_FRAMES.YEARLY:
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case TIME_FRAMES.MONTHLY:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case TIME_FRAMES.WEEKLY:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case TIME_FRAMES.DAILY:
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate = new Date(0);
  }

  return { $match: { created_at: { $gte: startDate } } };
};

const buildTimeFrameQuery = (timeFrame) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate;

  switch (timeFrame) {
    case TIME_FRAMES.DAILY:
      startDate = today;
      break;
    case TIME_FRAMES.WEEKLY:
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case TIME_FRAMES.MONTHLY:
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case TIME_FRAMES.YEARLY:
      startDate = new Date(today);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      return {};
  }

  return { created_at: { $gte: startDate } };
};

const getGroupingFormat = (timeFrame) => {
  const formats = {
    [TIME_FRAMES.YEARLY]: '%Y',
    [TIME_FRAMES.MONTHLY]: '%Y-%m-%d',
    [TIME_FRAMES.WEEKLY]: '%Y-%m-%d',
    [TIME_FRAMES.DAILY]: '%Y-%m-%d'
  };

  return formats[timeFrame] || '%Y-%m-%d';
};

module.exports = {
  TIME_FRAMES,
  ORDER_STATUS,
  getTimeFrameMatchStage,
  buildTimeFrameQuery,
  getGroupingFormat
};
