"use strict";

/** Middleware to handle authentication & authorization. */

const jwt = require("jsonwebtoken");
const db = require("../db");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ForbiddenError, NotFoundError } = require("../expressError");

/**
 * Middleware: Authenticate user.
 * 
 * - Extracts JWT token from the `Authorization` header.
 * - If valid, stores the decoded token payload in `res.locals.user`.
 * - If missing or invalid, no error is thrown (allows public access).
 */
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/**
 * Middleware: Ensure user is logged in.
 *
 * Throws `UnauthorizedError` if no valid token is provided.
 */
function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError("You must be logged in");
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Middleware: Ensure user matches the route parameter.
 *
 * Only allows access if the logged-in user matches `req.params.username`.
 * Throws `UnauthorizedError` if not.
 */
function ensureCorrectUser(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user || user.username !== req.params.username) {
      throw new UnauthorizedError("Access denied");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Middleware: Ensure the logged-in user owns the playlist.
 *
 * - Fetches the playlist owner from the database.
 * - Throws `ForbiddenError` if the user does not own the playlist.
 */
async function ensurePlaylistOwner(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user) throw new UnauthorizedError("You must be logged in");

    const playlistId = req.params.id;
    const result = await db.query(
      `SELECT user_id FROM playlists WHERE id = $1`,
      [playlistId]
    );

    const playlist = result.rows[0];
    if (!playlist) throw new NotFoundError("Playlist not found");

    if (playlist.user_id !== user.id) {
      throw new ForbiddenError("You do not own this playlist");
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  ensurePlaylistOwner,
};
