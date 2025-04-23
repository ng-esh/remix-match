// This route will include:
// - POST /auth/register for registration
// - POST /auth/login for login/authentication
// - GET /users/:userId to retrieve user info by ID (auth protected)
// - GET /users/username/:username to look up users by username (public or semi-protected)

"use strict";

/** Routes for users. */
const jsonschema = require("jsonschema");
const express = require("express");
const User = require("../models/user");
const router = new express.Router();

const { createToken } = require("../helpers/tokens");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const db = require("../db");
const userUpdateSchema = require("../schema/userUpdate.json");
const userSearchQuerySchema = require("../schema/userSearchQuery.json");



/**
 * GET /users/:userId
 * 
 * Get user info by user ID.
 * Authorization: must be logged in and correct user.
 */
router.get("/users/:userId", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
  try {
    const user = await User.getById(req.params.userId);
    if (!user) throw new BadRequestError("User not found");
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /users/search?query=... => [{ id, username }]
 * 
 * Fuzzy search for users by username.
 * Authorization: must be logged in.
 */
router.get("/search", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.query, userSearchQuerySchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    const usersRes = await db.query(
      `SELECT id, username
       FROM users
       WHERE username ILIKE $1`,
      [`%${req.query.query}%`]
    );

    return res.json({users: usersRes.rows});
  } catch (err) {
    return next(err);
  }
});

  /**
   * GET /username/:username
   * 
   * Get user info by username.
   * Public route (or protect with auth if preferred).
   */
  router.get("/username/:username", async function (req, res, next) {
    try {
      const user = await User.getByUsername(req.params.username);
      if (!user) throw new NotFoundError("User not found");
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });

/**
 * PATCH /users/:username
 * 
 * Update user profile.
 * Request body: { username }
 * Authorization: must be the correct user.
 */

router.patch("/users/:username", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }

    const updated = await User.updateByUsername(req.params.username, req.body);
    return res.json({ user: updated });
  } catch (err) {
    return next(err);
  }
});


/**
 * DELETE /users/:username
 * 
 * Delete a user account.
 * Authorization: must be the correct user.
 */
router.delete("/users/:username", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
  try {
    await User.deleteByUsername(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;


