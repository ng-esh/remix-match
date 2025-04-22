const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/**
 * Create a signed JWT token for testing or auth purposes.
 * @param {Object} user - A user object containing at least { id, email }.
 * @returns {string} Signed JWT.
 */
function createToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    ...(user.isAdmin !== undefined && { isAdmin: user.isAdmin })
  };

  return jwt.sign(payload, SECRET_KEY);
}

  
  module.exports = { createToken };