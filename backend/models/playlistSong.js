// What playlistSong.js Will Do
// - Add a song to a playlist 
// - Remove a song from a playlist 
// - Get all songs in a specific playlist 
// - Ensure users can only modify their own playlists (Handled by ensurePlaylistOwner in routes)

// models/playlistSong.js

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");

class PlaylistSong {
  /**
   * Add a song to a playlist.
   *
   * @param {number} playlistId - The ID of the playlist.
   * @param {string} trackId - The Spotify track ID.
   * @param {number} userId - The ID of the user adding the song.
   * @returns {Object} - The newly added song entry.
   * @throws {BadRequestError} - If required fields are missing.
   */
  static async addSongToPlaylist({ playlistId, trackId, userId }) {
    if (!playlistId || !trackId || !userId) {
      throw new BadRequestError("Playlist ID, track ID, and user ID are required");
    }

    const result = await db.query(
      `INSERT INTO playlist_songs (playlist_id, track_id, added_by)
       VALUES ($1, $2, $3)
       RETURNING id, playlist_id, track_id, added_by, added_at`,
      [playlistId, trackId, userId]
    );

    return result.rows[0];
  }

  /**
   * Remove a song from a playlist.
   *
   * @param {number} playlistId - The ID of the playlist.
   * @param {string} trackId - The Spotify track ID.
   * @returns {void}
   * @throws {NotFoundError} - If the song is not found in the playlist.
   */
  static async removeSongFromPlaylist(playlistId, trackId) {
    const result = await db.query(
      `DELETE FROM playlist_songs
       WHERE playlist_id = $1 AND track_id = $2
       RETURNING id`,
      [playlistId, trackId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError(`Song with track ID ${trackId} not found in playlist ${playlistId}`);
    }
  }

  /**
   * Get all songs in a specific playlist.
   *
   * @param {number} playlistId - The ID of the playlist.
   * @returns {Array<Object>} - List of songs in the playlist.
   * @throws {NotFoundError} - If no songs are found in the playlist.
   */
  static async getSongsInPlaylist(playlistId) {
    const result = await db.query(
      `SELECT track_id, added_by, added_at
       FROM playlist_songs
       WHERE playlist_id = $1
       ORDER BY added_at ASC`,
      [playlistId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`No songs found in playlist with ID ${playlistId}`);
    }

    return result.rows;
  }
}

module.exports = PlaylistSong;
