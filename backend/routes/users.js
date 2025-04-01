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
router.get("/users/:userId", ensureLoggedIn, async function (req, res, next) {
  try {
    const user = await User.getById(req.params.userId);
    if (!user) {
      throw new BadRequestError("User not found");
    }
    return res.json(user);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /users/username/:username
 * 
 * Search user by public username.
 * 
 * Authorization:
 * - Optional; can be public if needed.
 * 
 * Response:
 * { id, email, username, created_at }
 */
router.get("/users/username/:username", async function (req, res, next) {
  try {
    const user = await User.getByUsername(req.params.username);
    if (!user) {
      throw new BadRequestError("Username not found");
    }
    return res.json(user);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
