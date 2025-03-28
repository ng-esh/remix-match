// What playlistSong.js Will Do
// - Add a song to a playlist 
// - Remove a song from a playlist 
// - Get all songs in a specific playlist 
// - Ensure users can only modify their own playlists (Handled by ensurePlaylistOwner in routes)

// models/playlistSong.js

const db = require("../db");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../expressError");

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
   * Remove a song from a playlist (only if added by the same user).
   *
   * @param {number} playlistId - The ID of the playlist.
   * @param {string} trackId - The Spotify track ID.
   * @param {number} userId - The ID of the user attempting to remove the song.
   * @returns {void}
   * @throws {NotFoundError} - If the song is not found in the playlist.
   * @throws {ForbiddenError} - If the user is not the one who added the song.
   */
  static async removeSongFromPlaylist(playlistId, trackId, userId) {
    const songCheck = await db.query(
      `SELECT added_by FROM playlist_songs WHERE playlist_id = $1 AND track_id = $2`,
      [playlistId, trackId]
    );

    const song = songCheck.rows[0];

    if (!song) {
      throw new NotFoundError(`Song with track ID ${trackId} not found in playlist ${playlistId}`);
    }

    // Ensure only the user who added the song can remove it
    if (song.added_by !== userId) {
      throw new ForbiddenError("You can only remove songs you added");
    }

    await db.query(
      `DELETE FROM playlist_songs WHERE playlist_id = $1 AND track_id = $2`,
      [playlistId, trackId]
    );
  }

  /**
   * Get all songs in a specific playlist (includes playlist name).
   *
   * @param {number} playlistId - The ID of the playlist.
   * @returns {Array<Object>} - List of songs in the playlist, including playlist name.
   * @throws {NotFoundError} - If no songs are found in the playlist.
   */
  static async getSongsInPlaylist(playlistId) {
    const result = await db.query(
      `SELECT p.name AS playlist_name, ps.track_id, ps.added_by, ps.added_at
       FROM playlist_songs ps
       JOIN playlists p ON ps.playlist_id = p.id
       WHERE ps.playlist_id = $1
       ORDER BY ps.added_at ASC`,
      [playlistId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`No songs found in playlist with ID ${playlistId}`);
    }

    return result.rows;
  }
}

module.exports = PlaylistSong;

