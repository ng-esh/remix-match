const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/**
 * Create a signed JWT token for testing or auth purposes.
 * @param {Object} user - A user object containing at least { id, email }.
 * @returns {string} Signed JWT.
 */
function createToken(user) {
    // Sign the entire user object (excluding password)
    const payload = {
      id: user.id,
      username : user.username,
      email: user.email,
      ...(user.isAdmin !== undefined && { isAdmin: user.isAdmin })
    };
  
    return jwt.sign(payload, SECRET_KEY);
  }
  
  module.exports = { createToken };