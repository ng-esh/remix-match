// This route will include:
// - Creating a playlist (protected route)
// - Getting all public playlists
// - Getting all playlists by user
// - Searching playlists by name
// - Getting a single playlist by ID
// - Updating and deleting a playlist (owner-only)

// routes/playlists.js
"use strict";

const express = require("express");
const Playlist = require("../models/playlist");
const { BadRequestError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensurePlaylistOwner,
} = require("../middleware/auth");

const router = express.Router();

/** POST /playlists
 * 
 * Create a new playlist.
 * 
 * Request body: { name, isPublic }
 * Requires: user must be logged in.
 * 
 * Returns: { id, user_id, name, is_public, created_at }
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const userId = res.locals.user.id;
    const { name, isPublic } = req.body;
    const playlist = await Playlist.create({ userId, name, isPublic });
    return res.status(201).json({ playlist });
  } catch (err) {
    return next(err);
  }
});

/** GET /playlists
 * 
 * Retrieve all public playlists.
 * If query param userId is provided, get that user's playlists.
 * 
 * Returns: [ { id, user_id, name, is_public, created_at }, ... ]
 */
router.get("/", async function (req, res, next) {
  try {
    const { userId } = req.query;
    const playlists = await Playlist.getAll(userId ? { userId } : {});
    return res.json({ playlists });
  } catch (err) {
    return next(err);
  }
});

/** GET /playlists/search?name=Chill
 * 
 * Search playlists by name.
 * Requires user to be logged in.
 * 
 * Returns: [ { id, user_id, name, is_public, created_at }, ... ]
 */
router.get("/search", ensureLoggedIn, async function (req, res, next) {
  try {
    const { name } = req.query;
    if (!name) throw new BadRequestError("Search term 'name' is required.");
    const playlists = await Playlist.getByName(name);
    return res.json({ playlists });
  } catch (err) {
    return next(err);
  }
});

/** GET /playlists/:id
 * 
 * Retrieve a playlist by ID.
 * Public playlists can be accessed by anyone.
 * Private playlists can only be accessed by the owner.
 * 
 * Returns: { id, user_id, name, is_public, created_at }
 */
router.get("/:id", authenticateJWT, async function (req, res, next) {
  try {
    const playlist = await Playlist.getById(req.params.id);
    const user = res.locals.user;

    if (!playlist.is_public) {
      if (!user || playlist.user_id !== user.id) {
        throw new BadRequestError("Private playlist: access denied.");
      }
    }

    return res.json({ playlist });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /playlists/:id
 * 
 * Update a playlist (name or isPublic).
 * Requires user to be the playlist owner.
 * 
 * Request body: { name, isPublic }
 * Returns: updated playlist
 */
router.patch("/:id", ensureLoggedIn, ensurePlaylistOwner, async function (req, res, next) {
  try {
    const data = req.body;
    const playlist = await Playlist.update(req.params.id, data);
    return res.json({ playlist });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /playlists/:id
 * 
 * Delete a playlist.
 * Requires user to be the playlist owner.
 * 
 * Returns: { deleted: playlistId }
 */
router.delete("/:id", ensureLoggedIn, ensurePlaylistOwner, async function (req, res, next) {
  try {
    await Playlist.delete(req.params.id);
    return res.json({ deleted: +req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
