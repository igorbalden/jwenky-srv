const express = require('express');
const router = express.Router();


/**
 * All routes
 */
router.use('/users', require('./users'));
router.use('/password', require('./password'));
router.use('/auth', require('./auth'));

module.exports = router;
