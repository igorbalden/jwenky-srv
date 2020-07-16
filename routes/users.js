const express = require('express');
const router = express.Router();
const accessMiddle = require('../services/auth/AccessMiddle');


/**
 * More Page
 */
router.get('/more', accessMiddle.verifyJwt, 
  (req, res) => {
    res.status(200).json({msg: 'ok'});
});


/**
 * Dashboard Page
 */
router.get('/dashboard', accessMiddle.verifyJwtAdmin, 
  (req, res) => {
    res.status(200).json({msg: 'ok'});
});

module.exports = router;
