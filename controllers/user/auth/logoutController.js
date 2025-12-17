const { HTTP_STATUS } = require('../../../utils/constants');

const userLogout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.status(HTTP_STATUS.SERVER_ERROR).redirect('/');
    }
    delete req.session.user_id;
    delete req.user;
    res.redirect('/');
  });
};

module.exports = {
  userLogout
};
