// models/playlist.js
// Purpose of this Model
// - Manages playlist creation, retrieval, updating, and deletion.
// - Ensures users can only access their own playlists when needed.
// - Retrieves public playlists for discovery.



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
     * @param {number} playlistId - Playlist ID.
     * @param {Object} data - Fields to update.
     * @param {string} [data.name] - New playlist name.
     * @param {boolean} [data.isPublic] - New visibility setting.
     * @returns {Object} - Updated playlist data.
     * @throws {NotFoundError} - If playlist does not exist.
     * @throws {BadRequestError} - If no fields are provided.
     */
  static async update(playlistId, { name, isPublic }) {
    const fields = [];
    const values = [];
    let idx = 1;
  
    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
  
    if (isPublic !== undefined) {
      fields.push(`is_public = $${idx++}`);
      values.push(isPublic);
    }
  
    if (fields.length === 0) {
      throw new BadRequestError("No valid fields to update");
    }
  
    // Playlist ID should come after the fields — its placeholder needs the correct number
    const query = `
      UPDATE playlists
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, user_id, name, is_public, created_at
    `;
    values.push(playlistId);
  
    const result = await db.query(query, values);
    const updated = result.rows[0];
  
    if (!updated) {
      throw new NotFoundError(`Playlist with ID ${playlistId} not found`);
    }
  
    return updated;
  }
  
    

  /**
     * Delete a playlist.
     *
     * @param {number} id - Playlist ID.
     * @returns {void}
     * @throws {NotFoundError} - If playlist does not exist.
     */
    static async delete(id) {
    const result = await db.query(
      `DELETE FROM playlists WHERE id = $1 RETURNING id`,
      [id]
    );
  
    if (result.rowCount === 0) {
      throw new NotFoundError(`Playlist with ID ${id} not found`);
    }
  }
  
  
}

module.exports = Playlist;
