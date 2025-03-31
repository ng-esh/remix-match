// Purpose of this model:
// - Hosts can create live listening sessions (createSession()).
// - Users can join sessions (joinSession())
// - Users can leave sessions and when the last user leaves the session automatically closes and no one can join an inactive session.
// - Retrieve all active sessions and users in said active session in (getActiveSessions()).
// - Error handling is correct (NotFoundError, BadRequestError, ForbiddenError).

// models/liveListening.js

const db = require("../db");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../expressError");

class LiveListening {
  /**
   * Create a new live listening session.
   *
   * @param {number} hostId - The ID of the user hosting the session.
   * @param {string} sessionName - The name of the session.
   * @param {string} trackId - The Spotify track ID being played.
   * @returns {Object} - The newly created session.
   * @throws {BadRequestError} - If required fields are missing.
   */
  static async createSession({ hostId, sessionName, trackId }) {
    if (!hostId || !sessionName || !trackId) {
      throw new BadRequestError("Host ID, session name, and track ID are required");
    }

    const result = await db.query(
      `INSERT INTO live_sessions (host_id, session_name, track_id, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, host_id, session_name, track_id, is_active, created_at`,
      [hostId, sessionName, trackId]
    );

    return result.rows[0];
  }

  /**
   * Get all active sessions that a user is a part of.
   *
   * @param {number} userId - The ID of the user.
   * @returns {Array<Object>} - List of active sessions the user is in.
   */
  static async getUserActiveSessions(userId) {
    const result = await db.query(
      `SELECT s.id, s.host_id, s.session_name, s.track_id, s.created_at
       FROM live_sessions s
       JOIN live_session_users lu ON s.id = lu.session_id
       WHERE lu.user_id = $1 AND s.is_active = TRUE
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get all sessions (both active & inactive) for a specific host.
   *
   * @param {number} hostId - The ID of the host.
   * @returns {Array<Object>} - List of all sessions hosted by the user.
   */
  static async getHostSessions(hostId) {
    const result = await db.query(
      `SELECT id, session_name, track_id, is_active, created_at
       FROM live_sessions
       WHERE host_id = $1
       ORDER BY created_at DESC`,
      [hostId]
    );

    return result.rows;
  }

  /**
   * Join an existing live session (only if active).
   *
   * @param {number} sessionId - The ID of the live session.
   * @param {number} userId - The ID of the user joining the session.
   * @returns {Object} - The joined session details.
   * @throws {NotFoundError} - If session does not exist.
   * @throws {ForbiddenError} - If session is no longer active.
   */
  static async joinSession(sessionId, userId) {
    const sessionCheck = await db.query(
      `SELECT is_active FROM live_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      throw new NotFoundError(`Live session with ID ${sessionId} not found`);
    }

    if (!sessionCheck.rows[0].is_active) {
      throw new ForbiddenError("This session is no longer active");
    }

    await db.query(
      `INSERT INTO live_session_users (session_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [sessionId, userId]
    );

    return { message: "Joined session successfully" };
  }

  /**
   * Leave a live session.
   *
   * @param {number} sessionId - The ID of the live session.
   * @param {number} userId - The ID of the user leaving the session.
   * @returns {void}
   * @throws {NotFoundError} - If session does not exist or user is not in session.
   */
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

    // Check how many users are still in the session
    const remainingUsers = await db.query(
      `SELECT COUNT(*) AS count FROM live_session_users WHERE session_id = $1`,
      [sessionId]
    );

    if (parseInt(remainingUsers.rows[0].count) === 0) {
      await db.query(
        `UPDATE live_sessions
         SET is_active = FALSE
         WHERE id = $1`,
        [sessionId]
      );
    }
  }

  /**
   * Get all active live listening sessions (includes participants).
   *
   * @returns {Array<Object>} - List of active sessions with participants.
   */
  static async getActiveSessions() {
    const result = await db.query(
      `SELECT s.id, s.host_id, s.session_name, s.track_id, s.created_at,
              json_agg(u.username) AS participants
       FROM live_sessions s
       LEFT JOIN live_session_users lu ON s.id = lu.session_id
       LEFT JOIN users u ON lu.user_id = u.id
       WHERE s.is_active = TRUE
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    );

    return result.rows;
  }

  /**
   * End a live listening session (only the host can end it).
   *
   * @param {number} sessionId - The ID of the live session.
   * @param {number} hostId - The ID of the host ending the session.
   * @returns {void}
   * @throws {NotFoundError} - If session does not exist.
   * @throws {ForbiddenError} - If user is not the host.
   */
  static async endSession(sessionId, hostId) {
    const sessionCheck = await db.query(
      `SELECT host_id, is_active FROM live_sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      throw new NotFoundError(`Live session with ID ${sessionId} not found`);
    }

    const session = sessionCheck.rows[0];

    if (!session.is_active) {
      throw new ForbiddenError("This session has already ended");
    }

    if (session.host_id !== hostId) {
      throw new ForbiddenError("Only the host can end this session");
    }

    await db.query(
      `UPDATE live_sessions
       SET is_active = FALSE
       WHERE id = $1`,
      [sessionId]
    );
  }
}

module.exports = LiveListening;
