// This route will include:
// - POST /auth/register for registration
// - POST /auth/login for login/authentication
// - GET /users/:userId to retrieve user info by ID (auth protected)
// - GET /users/username/:username to look up users by username (public or semi-protected)

"use strict";

/** Routes for users. */

const express = require("express");
const router = new express.Router();

const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");

/**
 * POST /auth/register
 * 
 * Registers a new user and returns a signed JWT.
 * 
 * Request body:
 * { email, password, username }
 * 
 * Response:
 * { token }
 */
router.post("/auth/register", async function (req, res, next) {
  try {
    const newUser = await User.register(req.body);
    const token = createToken(newUser);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /auth/login
 * 
 * Authenticates a user and returns a signed JWT.
 * 
 * Request body:
 * { email, password }
 * 
 * Response:
 * { token }
 */
router.post("/auth/login", async function (req, res, next) {
  try {
    const user = await User.authenticate(req.body.email, req.body.password);
    const token = createToken(user);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /users/:userId
 * 
 * Get user info by user ID.
 * 
 * Authorization:
 * - Must be logged in.
 * 
 * Response:
 * { id, email, username, created_at }
 */
router.get("/users/:userId", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
    try {
      const user = await User.getById(req.params.userId);
      if (!user) {
        throw new BadRequestError("User not found");
      }
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });

/** GET /users/search?query=... => [{ id, username }]
 *
 * Fuzzy search for users by username (case-insensitive).
 * Restricted to logged-in users.
 */
router.get("/search", ensureLoggedIn, async function (req, res, next) {
    try {
      const query = req.query.query;
  
      if (!query || query.trim() === "") {
        return res.status(400).json({ error: "Search query is required." });
      }
  
      const usersRes = await db.query(
        `SELECT id, username
         FROM users
         WHERE username ILIKE $1`,
        [`%${query}%`]
      );
  
      return res.json(usersRes.rows);
    } catch (err) {
      return next(err);
    }
  }); 

/**
 * PATCH /users/:userId
 *
 * Update user profile.
 * Request body: { email, password }
 * Authorization: must be the correct user.
 * Response: { user }
 */
router.patch("/users/:userId", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
    try {
      const data = req.body;
      if (!data.email && !data.password) {
        throw new BadRequestError("At least one field must be provided to update");
      }
  
      const updated = await User.update(req.params.userId, data);
      return res.json({ user: updated });
    } catch (err) {
      return next(err);
    }
  });
  
/**
* DELETE /users/:userId
*
* Delete a user account.
* Authorization: must be the correct user.
* Response: { deleted: userId }
*/
router.delete("/users/:userId", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
    try {
      await User.delete(req.params.userId);
      return res.json({ deleted: +req.params.userId });
    } catch (err) {
      return next(err);
    }
  });




module.exports = router;
