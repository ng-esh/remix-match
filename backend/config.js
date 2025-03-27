// config.js
require('dotenv').config();

const BCRYPT_WORK_FACTOR = 12;

module.exports = {
  PORT: process.env.PORT || 3001,
  SECRET_KEY: process.env.SECRET_KEY || 'secret-dev',
  DATABASE_URL: process.env.DATABASE_URL,
  BCRYPT_WORK_FACTOR
};
