// What playlistSong.js Will Do
// - Add a song to a playlist 
// - Remove a song from a playlist 
// - Get all songs in a specific playlist 
// - Ensure users can only modify their own playlists (Handled by ensurePlaylistOwner in routes)

// models/playlistSong.js

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** PlaylistSong class for managing song entries in playlists */
class PlaylistSong {
  /**
   * Add a song to a playlist.
   *
   * @param {Object} data - Song data.
   * @param {number} data.playlistId - ID of the playlist.
   * @param {string} data.trackId - Spotify track ID.
   * @param {number} data.userId - ID of the user adding the song.
   * @param {number} [data.position] - Optional position to insert the song at.
   * @returns {Object} - Newly added song data.
   * @throws {BadRequestError} - If song already exists in playlist.
   */
  static async addSongToPlaylist({ playlistId, trackId, userId, position }) {
    try {
      // Check if song already exists in playlist
      const duplicateCheck = await db.query(
        `SELECT 1 FROM playlist_songs WHERE playlist_id = $1 AND track_id = $2`,
        [playlistId, trackId]
      );
      if (duplicateCheck.rowCount > 0) {
        throw new BadRequestError("Song already exists in this playlist");
      }

      // If position is specified, shift down songs at or after that position
      if (position !== undefined) {
        await db.query(
          `UPDATE playlist_songs
           SET position = position + 1
           WHERE playlist_id = $1 AND position >= $2`,
          [playlistId, position]
        );
      }

      // Insert song with specified or next position
      const result = await db.query(
        `INSERT INTO playlist_songs (playlist_id, track_id, added_by, position)
         VALUES ($1, $2, $3, COALESCE($4, (
           SELECT COALESCE(MAX(position), 0) + 1 FROM playlist_songs WHERE playlist_id = $1
         )))
         RETURNING id, playlist_id, track_id, added_by, position, added_at`,
        [playlistId, trackId, userId, position]
      );

      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  /**
   * Remove a song from a playlist.
   *
   * @param {number} playlistId - Playlist ID.
   * @param {string} trackId - Spotify track ID.
   * @param {number} userId - ID of the user removing the song.
   * @returns {Object} - Confirmation of removal.
   * @throws {NotFoundError} - If the song is not found in the playlist.
   */
  static async removeSongFromPlaylist(playlistId, trackId, userId) {
    const songCheck = await db.query(
      `SELECT added_by FROM playlist_songs WHERE playlist_id = $1 AND track_id = $2`,
      [playlistId, trackId]
    );

    if (songCheck.rowCount === 0) {
      throw new NotFoundError(`Song ${trackId} not found in playlist ${playlistId}`);
    }

    const result = await db.query(
      `DELETE FROM playlist_songs
       WHERE playlist_id = $1 AND track_id = $2
       RETURNING playlist_id, track_id`,
      [playlistId, trackId]
    );

    return result.rows[0];
  }

  /**
   * Get all songs in a playlist, ordered by position.
   *
   * @param {number} playlistId - Playlist ID.
   * @returns {Array} - List of song objects.
   * @throws {NotFoundError} - If no songs found.
   */
  static async getSongsInPlaylist(playlistId) {
    const result = await db.query(
      `SELECT track_id, added_by, added_at, position
       FROM playlist_songs
       WHERE playlist_id = $1
       ORDER BY position`,
      [playlistId]
    );

    return result.rows;
  }

  /**
   * Reorder songs in a playlist by providing a new array of track IDs.
   *
   * @param {number} playlistId - Playlist ID.
   * @param {string[]} orderedTrackIds - Array of Spotify track IDs in the new order.
   * @returns {Array} - Updated list of songs with new positions.
   * @throws {BadRequestError} - If any track is not found in playlist.
   */
  static async reorderSongs(playlistId, orderedTrackIds) {
    if (!playlistId || !Array.isArray(orderedTrackIds) || orderedTrackIds.length === 0) {
      throw new BadRequestError("Playlist ID and a non-empty array of track IDs are required");
    }
    
    const placeholders = orderedTrackIds.map((_, idx) => `$${idx + 2}`).join(", ");
    const checkRes = await db.query(
      `SELECT track_id FROM playlist_songs WHERE playlist_id = $1 AND track_id IN (${placeholders})`,
      [playlistId, ...orderedTrackIds]
    );

    const foundTracks = new Set(checkRes.rows.map(r => r.track_id));
    for (let trackId of orderedTrackIds) {
      if (!foundTracks.has(trackId)) {
        throw new BadRequestError(`Track ID ${trackId} is not in playlist ${playlistId}`);
      }
    }

    for (let i = 0; i < orderedTrackIds.length; i++) {
      await db.query(
        `UPDATE playlist_songs
         SET position = $1
         WHERE playlist_id = $2 AND track_id = $3`,
        [i + 1, playlistId, orderedTrackIds[i]]
      );
    }

    const updated = await db.query(
      `SELECT track_id, added_by, added_at, position
       FROM playlist_songs
       WHERE playlist_id = $1
       ORDER BY position`,
      [playlistId]
    );

    return updated.rows;
  }
}




module.exports = PlaylistSong;
