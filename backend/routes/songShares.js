// This route file will handle:
// - Sharing a song between users
// - Viewing received shares
// - Viewing sent shares
// - Deleting a share

// routes/songShares.js

"use strict";
const db = require("../db");
const express = require("express");
const router = express.Router();

const SongShare = require("../models/songShare");
const { ensureLoggedIn } = require("../middleware/auth");
const { NotFoundError, ForbiddenError } = require("../expressError");


/**
 * POST /shares
 * 
 * Share a song with another user.
 * 
 * Request body:
 * { sharedWith, playlistId, trackId, message }
 * 
 * Returns:
 * { id, shared_by, shared_with, playlist_id, track_id, message, created_at }
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const sharedBy = res.locals.user.id;
    const { sharedWith, playlistId, trackId, message } = req.body;

    const share = await SongShare.shareSong({
      sharedBy,
      sharedWith,
      playlistId,
      trackId,
      message,
    });

    return res.status(201).json({ share });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /shares/received
 * 
 * Get songs shared *with* the logged-in user.
 * 
 * Returns:
 * [ { id, shared_by, playlist_id, track_id, message, created_at }, ... ]
 */
router.get("/received", ensureLoggedIn, async function (req, res, next) {
  try {
    const userId = res.locals.user.id;
    const shares = await SongShare.getReceivedShares(userId);
    return res.json({ shares });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /shares/sent
 * 
 * Get songs the logged-in user has shared *with others*.
 * 
 * Returns:
 * [ { id, shared_with, playlist_id, track_id, message, created_at }, ... ]
 */
router.get("/sent", ensureLoggedIn, async function (req, res, next) {
  try {
    const userId = res.locals.user.id;
    const shares = await SongShare.getSentShares(userId);
    return res.json({ shares });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /shares/:id
 *
 * Deletes a shared song.
 * Allowed if user is either the sender or the receiver.
 * 
 * Returns: { deleted: shareId }
 */

router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
      const userId = res.locals.user.id;
      const shareId = req.params.id;

      console.log("🔍 Attempting to delete share", { userId, shareId });
  
      const result = await db.query(
        `SELECT shared_by, shared_with
         FROM shares
         WHERE id = $1`,
        [shareId]
      );
  
      const share = result.rows[0];
  
      if (!share) { 
        console.error("❌ Share not found", shareId);
        throw new NotFoundError(`Share with ID ${shareId} not found`);
      }

      if (Number(share.shared_by) !== userId && Number(share.shared_with) !== userId) {
        console.error("🚫 Forbidden — not authorized", {
          userId, 
          shared_by: share.shared_by,
          shared_with: share.shared_with
        });
        throw new ForbiddenError("You do not have permission to delete this share");
      }
  
      await db.query(`DELETE FROM shares WHERE id = $1`, [shareId]);

      console.log("🗑️ Successfully deleted share", shareId);
      return res.json({ deleted: shareId });

    } catch (err) {
      console.error("🔥 DELETE error:", err.constructor.name, err.message);
      return next(err);
    }
  });
  
module.exports = router;
