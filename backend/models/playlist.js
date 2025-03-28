// models/playlist.js

const db = require('../db');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} = require('../expressError');

class Playlist {
  /**
   * Create a new playlist for a user.
   *
   * @param {Object} data - Playlist data.
   * @param {number} data.userId - ID of the user creating the playlist.
   * @param {string} data.name - Playlist name.
   * @param {boolean} [data.isPublic=true] - Whether playlist is public.
   * @returns {Object} - Created playlist data.
   * @throws {BadRequestError} - If required fields are missing.
   */
  static async create({ userId, name, isPublic = true }) {
    if (!userId || !name) {
      throw new BadRequestError("User ID and playlist name are required");
    }

    const result = await db.query(
      `INSERT INTO playlists (user_id, name, is_public)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, is_public, created_at`,
      [userId, name, isPublic]
    );

    return result.rows[0];
  }

  /**
   * Get all public playlists or playlists by a specific user.
   *
   * @param {Object} [filter] - Optional filter by userId.
   * @returns {Array<Object>} - List of playlists.
   */
  static async getAll(filter = {}) {
    let result;
    if (filter.userId) {
      result = await db.query(
        `SELECT id, user_id, name, is_public, created_at
         FROM playlists
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [filter.userId]
      );
    } else {
      result = await db.query(
        `SELECT id, user_id, name, is_public, created_at
         FROM playlists
         WHERE is_public = TRUE
         ORDER BY created_at DESC`
      );
    }
    return result.rows;
  }

  /**
   * Search for playlists by name (case-insensitive).
   *
   * @param {string} name - Playlist name (or part of the name).
   * @returns {Array<Object>} - List of matching playlists.
   * @throws {NotFoundError} - If no playlists match.
   */
  static async getByName(name) {
    const result = await db.query(
      `SELECT id, user_id, name, is_public, created_at
       FROM playlists
       WHERE LOWER(name) LIKE LOWER($1)
       ORDER BY created_at DESC`,
      [`%${name}%`] // Partial match search
    );

    if (result.rows.length === 0) {
      throw new NotFoundError(`No playlists found with name "${name}"`);
    }

    return result.rows;
  }

  /**
   * Get a single playlist by ID.
   *
   * @param {number} id - Playlist ID.
   * @returns {Object} - Playlist data.
   * @throws {NotFoundError} - If playlist does not exist.
   */
  static async getById(id) {
    const result = await db.query(
      `SELECT id, user_id, name, is_public, created_at
       FROM playlists
       WHERE id = $1`,
      [id]
    );

    const playlist = result.rows[0];
    if (!playlist) throw new NotFoundError(`Playlist with ID ${id} not found`);

    return playlist;
  }

  /**
   * Update playlist name or visibility.
   *
   * @param {number} id - Playlist ID.
   * @param {Object} data - Fields to update.
   * @param {string} [data.name] - New playlist name.
   * @param {boolean} [data.isPublic] - New visibility setting.
   * @returns {Object} - Updated playlist data.
   * @throws {NotFoundError} - If playlist does not exist.
   */
  static async update(id, { name, isPublic }) {
    const result = await db.query(
      `UPDATE playlists
       SET name = COALESCE($1, name),
           is_public = COALESCE($2, is_public)
       WHERE id = $3
       RETURNING id, user_id, name, is_public, created_at`,
      [name, isPublic, id]
    );

    const playlist = result.rows[0];
    if (!playlist) throw new NotFoundError(`Playlist with ID ${id} not found`);

    return playlist;
  }

  /**
     * Delete a playlist (only if the requesting user is the owner).
     *
     * @param {number} playlistId - The ID of the playlist to delete.
     * @param {number} userId - The ID of the user attempting to delete the playlist.
     * @returns {void}
     * @throws {NotFoundError} - If the playlist does not exist.
     * @throws {ForbiddenError} - If the user is not the playlist owner.
     */
    static async delete(playlistId, userId) {
        // Step 1: Retrieve the playlist to check ownership
        const result = await db.query(
        `SELECT user_id FROM playlists WHERE id = $1`,
        [playlistId]
        );
    
        const playlist = result.rows[0];
    
        // Step 2: If no playlist is found, throw a NotFoundError
        if (!playlist) {
        throw new NotFoundError(`Playlist with ID ${playlistId} not found`);
        }
    
        // Step 3: Check if the user is the owner
        if (playlist.user_id !== userId) {
        throw new ForbiddenError("You are not allowed to delete this playlist");
        }
    
        // Step 4: Delete the playlist
        await db.query(
        `DELETE FROM playlists WHERE id = $1`,
        [playlistId]
        );
    }
  
  
}

module.exports = Playlist;
