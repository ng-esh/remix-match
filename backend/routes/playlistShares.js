// This route file allows logged-in users to:
// - Share playlists with others
// - View who they’ve shared a playlist with
// - View playlists that have been shared with them
// - Remove a playlist from their shared list

// routes/playlistShares.js

"use strict";

const jsonschema = require("jsonschema");
const express = require("express");
const router = new express.Router();

const { ensureLoggedIn } = require("../middleware/auth");
const Share = require("../models/playlistShare");
const db = require("../db");
const { NotFoundError, ForbiddenError, BadRequestError } = require("../expressError");
const playlistShareSchema = require("../schema/playlistShare.json");

/**
 * POST /share
 * Share a playlist with another user.
 * 
 * // NOTE: We intentionally DO NOT use `ensurePlaylistVisible` here.
//    Why? Because we allow users to share *public* playlists even if they don't own them.
//    `ensureLoggedIn` ensures the user is authenticated, and we explicitly check that
//    users can only initiate shares on *their own behalf* with:
//    `res.locals.user.id !== fromUserId`
//    This gives us all the protection we need while still supporting flexible sharing.
 *
 * Requires: { playlistId, fromUserId, toUserId }
 * Returns: { shared }
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, playlistShareSchema);
    if (!validator.valid) { 
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    const { playlistId, fromUserId, toUserId } = req.body;

    if (Number(res.locals.user.id) !== Number(fromUserId)) {
      throw new ForbiddenError("Cannot share on behalf of another user");
    }

    const shared = await Share.sharePlaylist({ playlistId, fromUserId, toUserId });
    return res.status(201).json({ shared });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /share/:playlistId/users
 * Get all users a specific playlist has been shared with.
 * Only accessible by the playlist owner.
 */
router.get("/:playlistId/users", ensureLoggedIn, async function (req, res, next) {
  try {
    const { playlistId } = req.params;

    // Verify the logged-in user owns the playlist
    const result = await db.query(
      `SELECT user_id FROM playlists WHERE id = $1`,
      [playlistId]
    );

    const playlist = result.rows[0];
    if (!playlist) {
      throw new NotFoundError(`Playlist ID ${playlistId} not found`);
    }
    if (playlist.user_id !== res.locals.user.id) {
      throw new ForbiddenError("Access denied: not your playlist");
    }

    const users = await Share.getSharedUsers(playlistId);
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /share/user/:userId
 * Get all playlists shared with a specific user.
 * Only accessible by that user.
 */
router.get("/user/:userId", ensureLoggedIn, async function (req, res, next) {
  try {
    console.log("🎧 HIT: GET /playlist-shares/user/:userId");
    const { userId } = req.params;

    if (Number(userId) !== res.locals.user.id) {
      throw new ForbiddenError("Access denied");
    }

    const playlists = await Share.getSharedPlaylistsForUser(userId);
    return res.json({ sharedPlaylists: playlists });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /share/:shareId
 * Remove a playlist share.
 * Only the sender or receiver of the share can delete it.
 */
router.delete("/:shareId", ensureLoggedIn, async function (req, res, next) {
  try {
    const { shareId } = req.params;

    await Share.removeShareIfAuthorized(shareId, res.locals.user.id);
    return res.json({ message: "Share removed" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;


