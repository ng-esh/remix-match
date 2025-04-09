// What playlistShare.js Will Do
// - Allow a user to share a playlist with another user 
// - Retrieve all users a playlist has been shared with 
// - Remove a shared playlist from a user's shared list 
// - Prevent duplicate sharing (can't share the same playlist with the same user twice) 
// - Allow users to view playlists shared with them (getSharedPlaylistsForUser(toUserId)).
// - Include sender (fromUser) info in getSharedUsers(playlistId).

// // models/share.js

const db = require("../db");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../expressError");

class Share {
  /**
   * Share a playlist with another user.
   *
   * @param {number} playlistId - The ID of the playlist.
   * @param {number} fromUserId - The ID of the user sharing the playlist.
   * @param {number} toUserId - The ID of the recipient user.
   * @returns {Object} - The shared playlist entry.
   * @throws {BadRequestError} - If required fields are missing or playlist is already shared with the user.
   */
  static async sharePlaylist({ playlistId, fromUserId, toUserId }) {
    if (!playlistId || !fromUserId || !toUserId) {
      throw new BadRequestError("Playlist ID, sender, and recipient user ID are required");
    }

    // Check if the playlist is already shared with the user
    const duplicateCheck = await db.query(
      `SELECT id FROM shared_playlists WHERE playlist_id = $1 AND to_user_id = $2`,
      [playlistId, toUserId]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new BadRequestError("This playlist has already been shared with this user");
    }

    const result = await db.query(
      `INSERT INTO shared_playlists (playlist_id, from_user_id, to_user_id)
       VALUES ($1, $2, $3)
       RETURNING id, playlist_id, from_user_id, to_user_id, shared_at`,
      [playlistId, fromUserId, toUserId]
    );

    return result.rows[0];
  }

  /**
   * Get all users a playlist has been shared with (includes sender info).
   *
   * @param {number} playlistId - The ID of the playlist.
   * @returns {Array<Object>} - List of users the playlist is shared with.
   * @throws {NotFoundError} - If the playlist has not been shared with anyone.
   */
  static async getSharedUsers(playlistId) {
    const result = await db.query(
      `SELECT u.id, u.username, u.email, sp.from_user_id
       FROM shared_playlists sp
       JOIN users u ON sp.to_user_id = u.id
       WHERE sp.playlist_id = $1`,
      [playlistId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`This playlist has not been shared with anyone`);
    }

    return result.rows;
  }

  /**
   * Get all playlists shared with a specific user.
   *
   * @param {number} toUserId - The ID of the recipient user.
   * @returns {Array<Object>} - List of shared playlists.
   * @throws {NotFoundError} - If no playlists are shared with the user.
   */
  static async getSharedPlaylistsForUser(toUserId) {
    const result = await db.query(
      `SELECT p.id, p.name, p.is_public, p.created_at, sp.shared_at
       FROM shared_playlists sp
       JOIN playlists p ON sp.playlist_id = p.id
       WHERE sp.to_user_id = $1
       ORDER BY sp.shared_at DESC`,
      [toUserId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`No playlists have been shared with user ID ${toUserId}`);
    }

    return result.rows;
  }

    /**
   * Remove a shared playlist interaction by its unique share ID.
   *
   * Only the sender (fromUserId) or receiver (toUserId) can delete it.
   *
   * @param {number} shareId - The unique ID of the share interaction.
   * @param {number} userId - The ID of the logged-in user requesting deletion.
   * @returns {void}
   * @throws {ForbiddenError} - If the user is not authorized to delete this share.
   * @throws {NotFoundError} - If no such share exists.
   */

    static async removeShareIfAuthorized(shareId, userId) {
      const result = await db.query(
        `SELECT id, from_user_id, to_user_id
         FROM shared_playlists
         WHERE id = $1`,
        [shareId]
      );
    
      const share = result.rows[0];

      if (!share) {
        throw new NotFoundError(`Share with ID ${shareId} not found`);
      }
      
      if (Number(share.from_user_id) !== Number(userId) &&
          Number(share.to_user_id) !== Number(userId)) {
        throw new ForbiddenError("You are not authorized to delete this share");
      }
      
      await db.query(
        `DELETE FROM shared_playlists
         WHERE id = $1`,
        [shareId]
      );
    }
  
  }


module.exports = Share;
