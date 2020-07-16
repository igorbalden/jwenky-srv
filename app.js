const express = require('express');
const cors = require('cors');
require('dotenv/config');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cookieParser(process.env.JWENKY_SECRET_KEY));
app.set('trust proxy', 1); // trust proxie required for https

// Express body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Global variables
app.use(function(req, res, next) {
  // res.locals.debug = true;
  next();
});

// No CORS
const corsOpt = {
  origin: [ 
    process.env.JWENKY_URL,
  ],
  methods: "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
  credentials: true,
  allowedHeaders: "Content-Type, Authorization, X-Requested-With, Origin, \
  Accept, Access-Control-Allow-Credentials, AuthHeader",
  exposedHeaders: "Authorization, Access-Control-Allow-Credentials, \
  X-Requested-With, Accept",
}
app.use(cors(corsOpt));

// Routes
app.use('/', require('./routes/index'));

const PORT = process.env.JWENKY_PORT || 5000;
app.listen(PORT, console.log(`Jwenky started on port ${PORT}`));
