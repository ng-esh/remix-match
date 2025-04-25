// What Vote.js will do:
// - Users can upvote/downvote a playlist (castVote()).
// - Prevents duplicate votes (users can only vote once per playlist).
// - Allows vote changes (users can switch from upvote to downvote or vice versa).
// - Retrieves total upvotes & downvotes (getPlaylistVotes()).
// - Users can remove their vote (removeVote()).
// - Error handling is correct (NotFoundError, BadRequestError)

// models/vote.js

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");

class Vote {
  /**
   * Cast a vote (upvote/downvote) on a playlist.
   *
   * @param {number} userId - The ID of the user voting.
   * @param {number} playlistId - The ID of the playlist.
   * @param {number} voteType - 1 for upvote, -1 for downvote.
   * @returns {Object} - Updated vote counts after voting.
   * @throws {BadRequestError} - If voteType is invalid.
   */
  static async castVote({ userId, playlistId, voteType }) {
    if (![1, -1].includes(voteType)) {
      throw new BadRequestError("Invalid vote type. Must be 1 (upvote) or -1 (downvote)");
    }

    // Check if the user has already voted on this playlist
    const existingVote = await db.query(
      `SELECT id, vote_type FROM votes WHERE user_id = $1 AND playlist_id = $2`,
      [userId, playlistId]
    );

    if (existingVote.rows.length > 0) {
      // User is changing their vote (update instead of insert)
      await db.query(
        `UPDATE votes
         SET vote_type = $1
         WHERE user_id = $2 AND playlist_id = $3`,
        [voteType, userId, playlistId]
      );
    } else {
      // Insert a new vote if none exists
      await db.query(
        `INSERT INTO votes (user_id, playlist_id, vote_type)
         VALUES ($1, $2, $3)`,
        [userId, playlistId, voteType]
      );
    }

    // Return updated vote counts after voting
    return await Vote.getPlaylistVotes(playlistId);
  }

  /** Get all votes cast by a specific user */
  static async getUserVotes(userId) {
    const result = await db.query(
      `SELECT playlist_id, vote_type
      FROM votes
      WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  }


  /**
   * Get total upvotes, downvotes, and total vote count for a playlist.
   *
   * @param {number} playlistId - The ID of the playlist.
   * @returns {Object} - { upvotes, downvotes, totalVotes }
   */
  static async getPlaylistVotes(playlistId) {
    const result = await db.query(
      `SELECT 
          COUNT(CASE WHEN vote_type = 1 THEN 1 END) AS upvotes,
          COUNT(CASE WHEN vote_type = -1 THEN 1 END) AS downvotes,
          COUNT(*) AS totalVotes
       FROM votes
       WHERE playlist_id = $1`,
      [playlistId]
    );

    return {
      upvotes: parseInt(result.rows[0].upvotes) || 0,
      downvotes: parseInt(result.rows[0].downvotes) || 0,
      totalVotes: parseInt(result.rows[0].totalvotes) || 0
    };
  }

  /**
   * Remove a vote from a playlist.
   *
   * @param {number} userId - The ID of the user.
   * @param {number} playlistId - The ID of the playlist.
   * @returns {void}
   * @throws {NotFoundError} - If the vote does not exist.
   */
  static async removeVote(userId, playlistId) {
    const result = await db.query(
      `DELETE FROM votes
       WHERE user_id = $1 AND playlist_id = $2
       RETURNING id`,
      [userId, playlistId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError(`No vote found for playlist ${playlistId} by user ${userId}`);
    }
  }
}

module.exports = Vote;
