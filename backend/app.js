// app.js
const express = require('express');
const cors = require("cors");
const morgan = require('morgan');
const app = express();

app.use(morgan('dev'));
app.use(express.json());

// Add routes here later
app.get('/', (req, res) => {
  return res.json({ message: 'Welcome to ReMixMatch API 🎵' });
});

// 404 handler
app.use((req, res, next) => {
  return res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message;
  return res.status(status).json({ error: message });
});

module.exports = app;
