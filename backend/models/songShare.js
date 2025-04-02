// what songShare.js will handle:
// - Sharing a single song from one user to another
// - Including an optional message
// - Getting all songs shared with a user
// - Deleting a song share

// models/songShare.js

"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Functions for individual song sharing */
class SongShare {
  /**
   * Share a song with another user.
   *
   * @param {Object} data - The share details.
   * @param {number} data.sharedBy - ID of the user sharing the song.
   * @param {number} data.sharedWith - ID of the receiving user.
   * @param {number} data.playlistId - ID of the playlist the song came from (optional but tracked).
   * @param {string} data.trackId - Spotify track ID.
   * @param {string} [data.message] - Optional message.
   * @returns {Object} - Details of the created share.
   */
  static async shareSong({ sharedBy, sharedWith, playlistId, trackId, message }) {
    const result = await db.query(
      `INSERT INTO shares (shared_by, shared_with, playlist_id, track_id, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, shared_by, shared_with, playlist_id, track_id, message, created_at`,
      [sharedBy, sharedWith, playlistId, trackId, message]
    );

    return result.rows[0];
  }

  /**
   * Get all songs shared *with* a user.
   *
   * @param {number} userId - ID of the receiving user.
   * @returns {Array<Object>} - List of shared song objects.
   */
  static async getReceivedShares(userId) {
    const result = await db.query(
      `SELECT id, shared_by, playlist_id, track_id, message, created_at
       FROM shares
       WHERE shared_with = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get all songs a user has shared *with others*.
   *
   * @param {number} userId - ID of the sharing user.
   * @returns {Array<Object>} - List of shared song objects.
   */
  static async getSentShares(userId) {
    const result = await db.query(
      `SELECT id, shared_with, playlist_id, track_id, message, created_at
       FROM shares
       WHERE shared_by = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Delete a shared song by its ID (e.g., if a user deletes a message).
   *
   * @param {number} shareId - The ID of the share record.
   * @returns {undefined}
   * @throws {NotFoundError} - If no such share exists.
   */
  static async deleteShare(shareId) {
    const result = await db.query(
      `DELETE FROM shares
       WHERE id = $1
       RETURNING id`,
      [shareId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(`No share found with ID: ${shareId}`);
    }
  }
}

module.exports = SongShare;

