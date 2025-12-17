const User = require('../models/user/userCredentials');

const getAuthenticatedUser = async (req) => {
  if (req.user) return req.user;
  if (req.session.user_id) return User.findById(req.session.user_id);
  return null;
};

module.exports = {
  getAuthenticatedUser
};