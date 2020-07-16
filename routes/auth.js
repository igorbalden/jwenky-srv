const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authMiddle = require('../services/auth/AuthMiddle');
const userModel = require('../services/mysql/UserModel');
const authConf = require('../config/auth');
const jwenkySecurity = require('../services/security/JwenkySecurity');
const {check, validationResult} = require('express-validator');
const {authLimiterMiddle} = require('../services/rateLimiter/rateLimiter');
const uuidv4 = require('uuid/v4');
var jwt = require('jsonwebtoken');
// const fs = require('fs');


/**
 * Login Post
 */ 
router.post('/login', [
  authLimiterMiddle, 
  authMiddle.authenticateUser
  ],
  async (req, res) => {
    // authentication has succeeded
    console.log('Logged-in', req.user.email)
    const user = req.user;
    const userOut = {
      id: user.id, 
      name: user.name, 
      email: user.email, 
      is_admin: user.is_admin
    };
    const [fingerKey, fingerHash] = await jwenkySecurity.genRandomPair();
    const privateKey = process.env.JWENKY_PRIVATE_KEY;
    // const privateKey = fs.readFileSync('jwtRS256.key', 'utf8');
    if (!privateKey) {return res.status(500).end();}
    const accessToken = jwt.sign(
      {user: user.id, is_admin: user.is_admin, fingerHash: fingerHash}, 
      privateKey, 
      { algorithm: 'RS256', expiresIn: authConf.accessDuration });
    const [refreshKey, refreshHash] = await jwenkySecurity.genRandomPair();
    const uuid = uuidv4();
    userModel.saveRefresh(refreshHash, req.user.id, uuid);
    const accOptions = {
      // secure: true,    // over https only
      httpOnly: true,
      sameSite: "Lax",
      expires: new Date(Date.now() + authConf.accessDuration * 1000), 
    };
    const rfrOptions = {
      path: '/auth',
      // secure: true,    // over https only
      httpOnly: true,
      sameSite: "Lax",
      expires: new Date(Date.now() + authConf.refreshDuration * 1000), 
    };
    res.cookie('JwenkyAccess', fingerKey, accOptions);
    res.cookie('JwenkyRefresh', 
      uuid+refreshKey, rfrOptions);
    res.set('authorization', 'Bearer '+ accessToken);
    res.json({user: userOut});
  }
);


/**
 * Logout current user session
 */
router.post('/logout', (req, res) => {
  const uuid = req.cookies.JwenkyRefresh.slice(0,36);
  userModel.deleteRefresh(uuid)
  .catch(err => console.log(err));
  return res.send('Logged out.').end();
});


/**
 * Logout all user sessions
 */
router.post('/logoutAll', (req, res) => {
  const id = req.body.uid;
  userModel.deleteRefreshAll(id)
  .catch(err => console.log(err));
  return res.send('Logged out of all sessions.').end();
});


/**
 * Refresh post
 */
router.post('/refresh_token', authLimiterMiddle, (req, res) => {
  if (typeof req.cookies == 'undefined' ||
      typeof req.cookies.JwenkyRefresh == 'undefined')
  {  
    return res.status(401).send('RefreshToken expired').end();
  }
  const uuid = req.cookies.JwenkyRefresh.slice(0,36);
  const token = req.cookies.JwenkyRefresh.slice(36);
  userModel.findActiveByUuid(uuid)
  .then((user) => {
    if (user) {
      bcrypt.compare(token, user.refresh)
      .then(async (result) => {
        if (result === true) {
          const userOut = {
            id: user.id, 
            name: user.name, 
            email: user.email, 
            is_admin: user.is_admin
          };
          const [fingerKey, fingerHash] = 
            await jwenkySecurity.genRandomPair();
          const privateKey = process.env.JWENKY_PRIVATE_KEY;
          // const privateKey = fs.readFileSync('jwtRS256.key', 'utf8');
          if (!privateKey) {return res.status(500).end();}
          const accessToken = jwt.sign({user: user.id, 
            is_admin: user.is_admin, fingerHash: fingerHash}, 
            privateKey, 
            { algorithm: 'RS256', expiresIn: authConf.accessDuration }); 
          const accOptions = {
            // secure: true,    // over https only
            httpOnly: true,
            sameSite: "Lax",
            expires: new Date(Date.now() + authConf.accessDuration * 1000), 
          };
          res.cookie('JwenkyAccess', fingerKey, accOptions);
          res.set('authorization', 'Bearer '+ accessToken);
          return res.json({user: userOut, msg: 'Token Refreshed'});
        }
      })
      .catch(e => {
        return res.status(500).send('No Refresh').end();
      });
    } else {
      // Admin has turn user inactive
      return res.send('No user').end();
    }
  });
});


/**
 * Register Post
 */ 
router.post('/register', [
  // Validation
  check('name').trim().isLength({min:2})
    .withMessage('Name min length 2 chars.')
    .isAlphanumeric().withMessage('Name can only contain letters and numbers.'),
  check('email').trim().isEmail().withMessage('Invalid email.')
    .custom(email => { 
      return( 
        userModel.findByEmail(email).then(user => {
          if (user && user !== null) return Promise.reject();
          else return Promise.resolve();
        }));
    }).withMessage('Email already exists.'),
  check('password').isLength({min:8})
    .withMessage('Password min length 8 chars.')
    .custom((value,{req}) => {
      if (value !== req.body.password2) return false;
      else return true;
    }).withMessage("Passwords don't match.")
  ], 
  (req, res) => {
    const {name, email, password} = req.body;
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
      return res.status(200).send(errors);
    }
    // Save new user
    const newUser = new userModel();
    newUser.name= name;
    newUser.email= email;
    bcrypt.genSalt(12, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          return res.status(500).send("Error saving user data");
        };
        newUser.password = hash;
        try {
          const usaved = await newUser.saveUs();
        } catch(err) {
          return res.status(500).send("Error saving in database");
        }
        return res.status(200).send('User created.');
      })
    });
  }
);

module.exports = router;
