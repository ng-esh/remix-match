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
      const payload = jwt.verify(token, SECRET_KEY);
      console.log("authenticateJWT → decoded token:", payload);
      res.locals.user = payload;
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
    console.log("ensureLoggedIn → res.locals.user:", res.locals.user);
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

/**
 * Middleware to ensure a user can view a playlist.
 *
 * Allows access if:
 *  - The playlist is marked as public, or
 *  - The logged-in user is the owner of the playlist.
 *
 * Requires user to be logged in (should be paired with ensureLoggedIn).
 *
 * Throws:
 *  - NotFoundError if the playlist does not exist.
 *  - ForbiddenError if the playlist is private and user is not the owner.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
async function ensurePlaylistVisible(req, res, next) {
  try {
    const userId = res.locals.user?.id;
    const playlistId = req.params.playlistId;

    const playlistRes = await db.query(
      `SELECT user_id, is_public FROM playlists WHERE id = $1`,
      [playlistId]
    );

    const playlist = playlistRes.rows[0];
    if (!playlist) throw new NotFoundError("Playlist not found");

    if (playlist.is_public || playlist.user_id === userId) {
      return next();
    }

    throw new ForbiddenError("You do not have access to this playlist");
  } catch (err) {
    return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  ensurePlaylistOwner,
  ensurePlaylistVisible,
};
