const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passwordModel = require('../services/mysql/PasswordModel');
const userModel = require('../services/mysql/UserModel');
const authConf = require('../config/auth');
const jwenkySecurity = require('../services/security/JwenkySecurity');
const {check, validationResult} = require('express-validator');
const {authLimiterMiddle} = require('../services/rateLimiter/rateLimiter');


/**
 * Forgot password Post
 * Save reset token in DB
 */
router.post('/forgotPassword', (req, res) => {
  const {email} = req.body;
  let errors = [];
  if (email === '') {
    return res.send({ err_msg: 'Please enter your email.'});
  }
  // Check user
  userModel.findActiveByEmail(email)
  .catch(() => {
    return res.status(500).send({err_msg: "Database error"});
  })
  .then((user) =>  {
    if (user == null) {
      return res.send({err_msg: "No user found for this email."});
    }
    if (user && user !== null) {
      jwenkySecurity.genRandomPair()
      .then(([randomKey, randomKeyHash]) => {
        // Save hash in DB 
        const pass = new passwordModel(email, randomKeyHash);
        pass.saveResetToken()
        .catch(err => {
          return res.status(500);
        })
        return randomKey;
      })
      .then((randomKey) => {
        if (!randomKey) {
          return res.status(500).send({err_msg: "An Error Occured."});
        } else {
          mailPassword(email, randomKey).catch(console.error);
          return res.send({msg:"An email has been sent with the reset link."});
        }
      })
    }  // if user exists
  })
});


/**
 * Send email with password reset link
 */
const mailPassword = async (mailAddr, randomKey) => {
  const makeMailer = require('../config/mail');
  const mailer = makeMailer();  // or makeMailer('other_custom_config')
  let validStr = authConf.passwordResetHours;
  validStr += (validStr === 1) ? ' hour.' : ' hours.';
  const surl = `${process.env.JWENKY_URL}/auth/reset-password/?key=${randomKey}&email=${mailAddr}`;
  const htmlMsg = `
    <p><strong>Reset Password</strong></p>
    <p>
    Click on the link bellow to reset you password:<br />
    <a href="${surl}" target="blank">${surl}</a>
    </p>
    <p>
    The link will be valid for ${validStr}
    </p>
  `;
  const txtMsg = `
    Reset Password
    \n
    Copy the link bellow, and paste it in the browser address bar, \n
    to reset you password:\n
    ${surl}\n
    The link will be valid for ${validStr}\n`;
  let info = await mailer.sendMail({
    from: '"Igor Balden" <ib@ib.loc>',
    to: mailAddr,
    subject: `${process.env.JWENKY_TITLE} - Password Reset`,
    text: txtMsg,
    html: htmlMsg
  });
};


/**
 * Reset password Post
 */
router.post('/resetPassword', [
  authLimiterMiddle,
  // Validation
  check('key')
    .custom((key, {req}) => {
      return(
        new Promise((resolve, reject) => {
          verifyKey(key, req)
          .then((ver) => {
            if (ver === true) return resolve();
            return reject('Invalid link-2');
          })
          .catch((err) => reject(err))
        }));
    }),
  check('email').trim().isEmail(),
  check('password').isLength({min:8})
    .withMessage('Password min length 8 chars')
  ], 
  (req, res) => {
    const { key, email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.send({errors: errors.errors});
    }
    // Store new pass in DB
    const passUser = new userModel();
    passUser.email = email;
    bcrypt.genSalt(12, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          return res.status(500);
        };
        passUser.password = hash;
        const updated = await passUser.updateUsPass();
        userModel.deleteRefreshAll(updated.id)
        .then(() => {
          return res.send({msg: 'Password reset successful.'});
        })
        .catch((err) => {
          return res.status(500);
        })
      })
    });
  }
);


/**
 * Verify valid reset Url provided
 */
const verifyKey = (key, req) => {
  return new Promise((resolve, reject) => {
    passwordModel.findByEmail(req.body.email)
    .then((dbToken) => {
      if (!dbToken) {
        return reject("Invalid link-1");
      } else {
        bcrypt.compare(key, dbToken[0].token).then(
          (result) => {
            if (result === true) return resolve(true);
            return reject("Invalid link-3");
        })
      }
    })
    .catch(err => {
      return reject("Key verification error");
    });
  });
};

module.exports = router;
