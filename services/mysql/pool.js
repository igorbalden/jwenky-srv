const util = require('util');
const mysql = require('mysql');

/**
 * Pool parameters
 */
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.JWENKY_MYSQL_HOST,
    user: process.env.JWENKY_MYSQL_USER, 
    password: process.env.JWENKY_MYSQL_PASSWORD, 
    database: process.env.JWENKY_MYSQL_DATABASE
});

/**
 * Connect to DB
 */
pool.getConnection((err, connection) => {
    if(err) 
        console.error("Something went wrong with the database connection.");
    if(connection)
        connection.release();
    return;
});

pool.query = util.promisify(pool.query);

module.exports = pool;
