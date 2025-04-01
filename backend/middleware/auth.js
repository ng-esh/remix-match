"use strict";

/** Middleware to handle authentication & authorization. */

const jwt = require("jsonwebtoken");
const db = require("../db");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ForbiddenError, NotFoundError } = require("../expressError");

/**
 * Middleware: Authenticate user using JWT.
 *
 * - Looks for a token in the `Authorization` header.
 * - If a valid token exists, it verifies it using the app's SECRET_KEY.
 * - If verification is successful, the decoded user payload is stored on `res.locals.user`.
 * - Does not throw an error if the token is missing or invalid—this allows for public routes.
 *
 * This middleware should run on every request so that downstream middleware and routes
 * can access `res.locals.user` to know the currently logged-in user.
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
 * Middleware: Ensure a user is logged in.
 *
 * - Requires that `res.locals.user` is set (via `authenticateJWT`).
 * - If not, responds with an `UnauthorizedError`.
 *
 * This middleware should be used to protect routes that require any authenticated user.
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
 * Middleware: Ensure the logged-in user matches the username in the route.
 *
 * - Compares the username in the token (`res.locals.user.username`) with `req.params.username`.
 * - If they don't match, responds with an `UnauthorizedError`.
 *
 * Use this to restrict user-specific operations like editing profiles.
 */
function ensureCorrectUser(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user || user.id !== parseInt(req.params.userId)) {
      return next(new ForbiddenError("You do not have permission to access this resource"));
    }
    return next();
  } catch (err) {
    return next(err);
  }
}


/**
 * Middleware: Ensure the logged-in user is the owner of a playlist.
 *
 * - Extracts the playlist ID from `req.params.id`.
 * - Queries the database for the playlist's `user_id`.
 * - If the playlist is not found, throws a `NotFoundError`.
 * - If the logged-in user (via `res.locals.user.id`) does not match the `user_id`, throws `ForbiddenError`.
 *
 * This protects endpoints like updating or deleting a playlist.
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

afterAll(async () => {
  await db.end();
});

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  ensurePlaylistOwner,
};
