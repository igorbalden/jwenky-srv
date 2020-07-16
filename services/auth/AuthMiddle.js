const userModel = require('../mysql/UserModel');
const bcrypt = require('bcryptjs');


module.exports = {
  /**
   * Check user submitted credentials
   */
  authenticateUser: function(req, res, next) {
    // Match user
    userModel.findOneActivePassw(req.body.email, 'email')
    .then((user) => {
      if (!user) {
        return res.status(401).json({error_msg: 'Email/Password incorrect'});
      }
      // Match password
      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({error_msg: 'DB error'});
        }
        if (isMatch) {
          req.user = user;
          return next();
        } else {
          return res.status(401)
            .json({error_msg: 'Email/Password incorrect'});
        }
      });
    })
    .catch(err => {
      return res.status(500).json({error_msg: 'DB error'});
    });
  }

};
