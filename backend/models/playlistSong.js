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
   * @param {Object} data - Data for adding a song.
   * @param {number} data.playlistId - ID of the playlist.
   * @param {string} data.trackId - Spotify track ID.
   * @param {number} data.userId - ID of the user adding the song.
   * @returns {Object} - The added song record.
   */
  static async addSongToPlaylist({ playlistId, trackId, userId }) {
    if (!playlistId || !trackId || !userId) {
      throw new BadRequestError("Playlist ID, track ID, and user ID are required");
    }

    try {
      const result = await db.query(
        `INSERT INTO playlist_songs (playlist_id, track_id, added_by)
         VALUES ($1, $2, $3)
         RETURNING id, playlist_id, track_id, added_by, added_at`,
        [playlistId, trackId, userId]
      );

      return result.rows[0];
    } catch (err) {
      if (err.code === "23505") {
        throw new BadRequestError("Song already in playlist");
      }
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

    const song = songCheck.rows[0];
    if (!song) throw new NotFoundError("Song not found in playlist");

    await db.query(
      `DELETE FROM playlist_songs WHERE playlist_id = $1 AND track_id = $2`,
      [playlistId, trackId]
    );

    return {
      playlist_id: playlistId,
      track_id: trackId
    };
  }

  /**
   * Get all songs in a playlist.
   *
   * @param {number} playlistId - Playlist ID.
   * @returns {Array<Object>} - List of song entries.
   */
  static async getSongsInPlaylist(playlistId) {
    const result = await db.query(
      `SELECT ps.track_id, ps.added_by, ps.added_at, p.name AS playlist_name
       FROM playlist_songs ps
         JOIN playlists p ON ps.playlist_id = p.id
       WHERE ps.playlist_id = $1`,
      [playlistId]
    );

    return result.rows;
  }
}

module.exports = PlaylistSong;
