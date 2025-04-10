// Purpose of this model:
// - Hosts can create live listening sessions (createSession()).
// - Users can join sessions (joinSession())
// - Users can leave sessions and when the last user leaves the session automatically closes and no one can join an inactive session.
// - Retrieve all active sessions and users in said active session in (getActiveSessions()).
// - Error handling is correct (NotFoundError, BadRequestError, ForbiddenError).

// models/liveListening.js
"use strict";

"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../expressError");

/** LiveListening manages live listening sessions for playlists, tracks, or albums */
class LiveListening {
  /**
   * Create a new live listening session.
   *
   * @param {Object} data - Session data.
   * @param {number} data.hostId - User ID of the session host.
   * @param {string} data.sessionName - Name of the session.
   * @param {string} data.sourceType - Type of source (playlist, track, or album).
   * @param {string} data.sourceId - Spotify ID for the source.
   * @returns {Object} Newly created session data.
   * @throws {BadRequestError} If required fields are missing.
   */
  static async createSession({ hostId, sessionName, sourceType, sourceId }) {
    if (!hostId || !sessionName || !sourceType || !sourceId) {
      throw new BadRequestError("Missing required fields to create session");
    }

    const result = await db.query(
      `INSERT INTO live_sessions (host_id, session_name, source_type, source_id, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, host_id, session_name, source_type, source_id, is_active, created_at`,
      [hostId, sessionName, sourceType, sourceId]
    );

    await db.query(
      `INSERT INTO live_session_users (session_id, user_id)
       VALUES ($1, $2)`,
      [result.rows[0].id, hostId]
    );

    return result.rows[0];
  }

  /** Join an existing session if it's active */
  static async joinSession(sessionId, userId) {
    const sessionRes = await db.query(
      `SELECT is_active FROM live_sessions WHERE id = $1`,
      [sessionId]
    );

    const session = sessionRes.rows[0];
    if (!session || !session.is_active) {
      throw new ForbiddenError("Cannot join an inactive or non-existent session");
    }

    await db.query(
      `INSERT INTO live_session_users (session_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [sessionId, userId]
    );

    return { sessionId, userId };
  }

  /** Remove a user from a session; end session if no users remain */
  static async leaveSession(sessionId, userId) {
    const result = await db.query(
      `DELETE FROM live_session_users
       WHERE session_id = $1 AND user_id = $2
       RETURNING session_id`,
      [sessionId, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError(`User ${userId} is not in session ${sessionId}`);
    }

    const usersLeft = await db.query(
      `SELECT COUNT(*) FROM live_session_users WHERE session_id = $1`,
      [sessionId]
    );

    if (+usersLeft.rows[0].count === 0) {
      await db.query(
        `UPDATE live_sessions SET is_active = FALSE WHERE id = $1`,
        [sessionId]
      );
    }

    return "User removed from session.";
  }

  /** Get all active sessions the user is currently part of */
  static async getUserActiveSessions(userId) {
    const result = await db.query(
      `SELECT s.id, s.host_id, s.session_name, s.source_type, s.source_id, s.created_at
       FROM live_sessions s
       JOIN live_session_users u ON s.id = u.session_id
       WHERE u.user_id = $1 AND s.is_active = TRUE`,
      [userId]
    );

    return result.rows;
  }

  /** Get all sessions hosted by a specific user */
  static async getHostSessions(hostId) {
    const result = await db.query(
      `SELECT id, host_id, session_name, source_type, source_id, is_active, created_at
       FROM live_sessions
       WHERE host_id = $1`,
      [hostId]
    );

    return result.rows;
  }

  /** End a session if the user is the host */
  static async endSession(sessionId, userId) {
    const sessionRes = await db.query(
      `SELECT host_id, is_active FROM live_sessions WHERE id = $1`,
      [sessionId]
    );
  
    const session = sessionRes.rows[0];
    if (!session) throw new NotFoundError("Session not found");
  
    if (session.host_id !== userId) {
      throw new ForbiddenError("Only the host can end this session");
    }
  
    if (!session.is_active) {
      return { message: "Session already inactive" };
    }
  
    await db.query(
      `UPDATE live_sessions SET is_active = FALSE WHERE id = $1`,
      [sessionId]
    );
  
    return { message: "Session ended successfully." };
  }
  
}

module.exports = LiveListening;
