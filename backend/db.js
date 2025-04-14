// db.js
const { Pool } = require('pg');
const { DATABASE_URL } = require('./config');

const db = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});


module.exports = db;
