// config.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  SECRET_KEY: process.env.SECRET_KEY || 'secret-dev',
  DATABASE_URL: process.env.DATABASE_URL,
};
