// tests/_testCommonRoutes.js

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const { createToken } = require("../helpers/tokens");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

let testUserToken;
let testUserToken2;
let testUserId;
let testUserId2;
let testPlaylistId;
let testPlaylistId2;
let testTrackId = "spotify:track:test123";
let testTrackId2 = "spotify:track:test456";
let testSessionId;

async function commonBeforeAll() {
  // Clear tables
  await db.query("DELETE FROM live_session_users");
  await db.query("DELETE FROM live_sessions");
  await db.query("DELETE FROM shares");
  await db.query("DELETE FROM shared_playlists");
  await db.query("DELETE FROM playlist_songs");
  await db.query("DELETE FROM playlists");
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM votes");

  // Insert test users
  const hashedPw1 = await bcrypt.hash("password1", BCRYPT_WORK_FACTOR);
  const hashedPw2 = await bcrypt.hash("password2", BCRYPT_WORK_FACTOR);

  const resUsers = await db.query(`
    INSERT INTO users (username, password, email)
    VALUES 
      ('alice', $1, 'alice@example.com'),
      ('bob', $2, 'bob@example.com')
    RETURNING id`, [hashedPw1, hashedPw2]);

  testUserId = resUsers.rows[0].id;
  testUserId2 = resUsers.rows[1].id;

  testUserToken = createToken({ id: testUserId });
  testUserToken2 = createToken({ id: testUserId2 });

  // Insert playlists
  const resPlaylists = await db.query(`
    INSERT INTO playlists (user_id, name, is_public)
    VALUES 
      ($1, 'Alice Public', TRUE),
      ($2, 'Bob Private', FALSE)
    RETURNING id`, [testUserId, testUserId2]);

  testPlaylistId = resPlaylists.rows[0].id;
  testPlaylistId2 = resPlaylists.rows[1].id;

  // Add songs
  await db.query(`
    INSERT INTO playlist_songs (playlist_id, track_id, added_by)
    VALUES 
      ($1, $2, $3),
      ($1, $4, $3)`, [testPlaylistId, testTrackId, testUserId, testTrackId2]);

  // Create a live session
  const resSession = await db.query(`
    INSERT INTO live_sessions (host_id, session_name, source_type, source_id, is_active)
    VALUES ($1, 'Test Session', 'playlist', $2, TRUE)
    RETURNING id`, [testUserId, testPlaylistId]);

  testSessionId = resSession.rows[0].id;

  await db.query(`
    INSERT INTO live_session_users (session_id, user_id)
    VALUES ($1, $2)`, [testSessionId, testUserId]);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

module.exports = {
  request,
  app,
  db,
  testUserToken,
  testUserToken2,
  testUserId,
  testUserId2,
  testPlaylistId,
  testPlaylistId2,
  testTrackId,
  testTrackId2,
  testSessionId,
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll
};
