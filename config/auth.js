const authConf = {
  
  // How long the password reset link will be valid (hours).
  passwordResetHours: 1,

  // How long the accessToken will be valid (seconds).
  accessDuration: 60 * 10,    // 10min

  // How long the refreshToken will be valid (seconds).
  refreshDuration: 60 * 60 * 20,    // 20h

  // Rate limiter database table name.
  raterDBTable: 'rate_limiter',
};

module.exports = authConf;
