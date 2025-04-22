// models/user.js

const db = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');

const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError
} = require('../expressError');

class User {
  /**
   * Register a new user with email, username, and hashed password.
   *
   * @param {Object} userData - Object containing email, password, username, first name and last name.
   * @returns {Object} - New user data (id, email, username, created_at).
   * @throws {BadRequestError} - If required fields are missing.
   */
  
    static async register({ email, password, username, firstName, lastName }) {
      if (!email || !password || !username || !firstName ||!lastName) {
      throw new BadRequestError("Email, password, username, first name, and last name are required");
    }
    
      // Step 1: Manually check for duplicate username/email before inserting
      const duplicateCheck = await db.query(
        `SELECT username, email FROM users WHERE username = $1 OR email = $2`,
        [username, email]
        );
    
        if (duplicateCheck.rows.length > 0) {
        const existingUser = duplicateCheck.rows[0];
        if (existingUser.username === username) {
            throw new BadRequestError("Username is already taken");
        }
        if (existingUser.email === email) {
            throw new BadRequestError("Email is already registered");
        }
        }
    
        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    
        try {
        // Step 2: Insert new user into the database
        const result = await db.query(
           `INSERT INTO users (email, password, username, first_name, last_name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, username, first_name AS "firstName", last_name AS "lastName", created_at`,
            [email, hashedPassword, username, firstName, lastName]
        );
    
        return result.rows[0];
    
        } catch (err) {
        // Step 3: Handle UNIQUE constraint errors at the database level (failsafe)
        if (err.code === '23505') {
            if (err.detail.includes("username")) {
            throw new BadRequestError("Username is already taken");
            }
            if (err.detail.includes("email")) {
            throw new BadRequestError("Email is already registered");
            }
        }
        throw err; // Re-throw unexpected errors
        }
    }
  

  /**
   * Authenticate a user by email and password.
   *
   * @param {string} email - The user's email address.
   * @param {string} password - The plain text password to validate.
   * @returns {Object} - User data if valid.
   * @throws {NotFoundError} - If no user exists with the given email.
   * @throws {UnauthorizedError} - If password is incorrect.
   */
  static async authenticate(email, password) {
    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const result = await db.query(
      `SELECT id, email, password, username, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundError("User not found with this email");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    delete user.password;
    return user;
  }

  /**
   * Retrieve user information by ID (used internally for auth/session).
   *
   * @param {number} userId - The user ID.
   * @returns {Object|null} - User data or null if not found.
   */
  static async getById(userId) {
    const result = await db.query(
      `SELECT id, email, username, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Retrieve user information by username (used for search/display).
   *
   * @param {string} username - The user's public username.
   * @returns {Object|null} - User data or null if not found.
   */
  static async getByUsername(username) {
    const result = await db.query(
      `SELECT id, email, username, created_at
       FROM users
       WHERE username = $1`,
      [username]
    );
    return result.rows[0] || null;
  }

  /** Search users by partial username (case-insensitive). */
  static async searchByUsername(query) {
    const result = await db.query(
       `SELECT id, username
        FROM users
        WHERE username ILIKE $1`,
        [`%${query}%`]
      );
      return result.rows;
    }

  /**
   * Update user data (only username allowed).
   *
   * @param {number} userId - ID of the user to update.
   * @param {Object} data - Data to update (only { username } allowed).
   * @returns {Object} - Updated user data.
   * @throws {BadRequestError} - If no data or invalid field provided.
   * @throws {NotFoundError} - If user not found.
   */
  static async update(userId, data) {
    if (!data || !data.username) {
      throw new BadRequestError("Username is required to update");
    }

    try {
      const result = await db.query(
        `UPDATE users
        SET username = $1
        WHERE id = $2
        RETURNING id, email, username, created_at`,
        [data.username, userId]
      );

      const user = result.rows[0];
      if (!user) throw new NotFoundError(`No user found with ID: ${userId}`);

      return user;

    } catch (err) {
      // Handle unique constraint error
      if (err.code === '23505' && err.detail.includes("username")) {
        throw new BadRequestError("Username is already taken");
      }

      throw err; // Rethrow other unexpected errors
    }
  }

  
  /** Delete user. */
  static async delete(userId) {
    const result = await db.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id`,
      [userId]
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user with ID: ${userId}`);
    return user.id;
  }
}

module.exports = User;
