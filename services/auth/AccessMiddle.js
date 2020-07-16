const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const fs = require('fs');


module.exports = {
  /**
   * Verify JWT
   */
  verifyJwt: function(req, res, next) {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    const publicKey = process.env.JWENKY_PUBLIC_KEY; 
    // const publicKey = fs.readFileSync('jwtRS256.key.pub', 'utf8');
    if (!publicKey || accessToken == null) {
      return res.sendStatus(401);
    }
    jwt.verify(accessToken, publicKey, 
      { algorithms: ['RS256'] }, 
      function(err, decoded) {
        if (err) {
          return res.status(500).send('Token expired').end();
        }
        const fingerKey = req.cookies.JwenkyAccess;
        bcrypt.compare(fingerKey, decoded.fingerHash)
        .then((result)=> {
          if (result === false) {
            return res.status(401).send('No Access').end();
          }
          if (!(/^\d+$/.test(decoded.user) && decoded.user > 0)) {
            // user id no good
            return res.status(401).send('User error').end();
          }
          // OK
          req.aTokenData = decoded;
          return next();
        })
        .catch((err) => {
          // No refresh
          return res.status(401).send('No Access').end();
        });
      }
    )
  },

  /**
   * Verify JWT and Admin level
   */
  verifyJwtAdmin: function(req, res, next) {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    const publicKey = process.env.JWENKY_PUBLIC_KEY; 
    // const publicKey = fs.readFileSync('jwtRS256.key.pub', 'utf8');
    if (!publicKey || accessToken == null) {
      return res.sendStatus(401);
    }
    jwt.verify(accessToken, publicKey, 
        { algorithms: ['RS256'] }, 
      function(err, decoded) {
        if (err) {
          return res.status(500).send('Token expired').end();
        }
        const fingerKey = req.cookies.JwenkyAccess;
        bcrypt.compare(fingerKey, decoded.fingerHash)
        .then((result)=> {
          if (result === false) {
            return res.status(401).send('No Access').end();
          }
          if (!(/^\d+$/.test(decoded.user) && decoded.user > 0)) {
            // user id no good
            return res.status(401).send('User error').end();
          }
          if (decoded.is_admin != 1) {
            // make a DB check before important admin actions
            // user is not admin 
            return res.status(403).send('Must be admin').end();
          }
          // OK
          req.aTokenData = decoded;
          return next();
        })
        .catch((err) => {
          // No refresh
          return res.status(401).send('No Access').end();
        });
      }
    )
  },

};
