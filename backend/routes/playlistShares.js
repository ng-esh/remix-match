// This route file allows logged-in users to:
// - Share playlists with others
// - View who they’ve shared a playlist with
// - View playlists that have been shared with them
// - Remove a playlist from their shared list

// routes/playlistShares.js
"use strict";

const express = require("express");
const router = express.Router();

const Share = require("../models/playlistShare");
const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");

/**
 * POST /share
 * Share a playlist with another user.
 *
 * Expects: { playlistId, fromUserId, toUserId }
 * Returns: { id, playlist_id, from_user_id, to_user_id, shared_at }
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const { playlistId, fromUserId, toUserId } = req.body;

    if (!playlistId || !fromUserId || !toUserId) {
      throw new BadRequestError("playlistId, fromUserId, and toUserId are required");
    }

    const shared = await Share.sharePlaylist({ playlistId, fromUserId, toUserId });
    return res.status(201).json({ shared });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /share/:playlistId/users
 * Get all users a playlist has been shared with.
 *
 * Returns: [{ id, username, email, from_user_id }, ...]
 */
router.get("/:playlistId/users", ensureLoggedIn, async function (req, res, next) {
  try {
    const { playlistId } = req.params;
    const users = await Share.getSharedUsers(playlistId);
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /share/user/:userId
 * Get all playlists shared with a specific user.
 *
 * Returns: [{ id, name, is_public, created_at, shared_at }, ...]
 */
router.get("/user/:userId", ensureLoggedIn, async function (req, res, next) {
  try {
    const { userId } = req.params;
    const playlists = await Share.getSharedPlaylistsForUser(userId);
    return res.json({ playlists });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /share
 * Remove a shared playlist from a user's shared list.
 *
 * Expects: { playlistId, toUserId }
 * Returns: { deleted: true }
 */
router.delete("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const { playlistId, toUserId } = req.body;

    if (!playlistId || !toUserId) {
      throw new BadRequestError("playlistId and toUserId are required");
    }

    await Share.removeSharedPlaylist(playlistId, toUserId);
    return res.json({ deleted: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
