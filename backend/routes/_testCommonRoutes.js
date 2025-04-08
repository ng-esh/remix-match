// tests/_testCommonRoutes.js

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const { createToken } = require("../helpers/tokens");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const teardown = require('../tests/dbTeardown'); 

// Arrays for multiple users
const testUserIds = [];
const testUserTokens = [];

let testPlaylistId;
let testPlaylistId2;
const testTrackId = "spotify:track:test123";
const testTrackId2 = "spotify:track:test456";
let testSessionId;

async function commonBeforeAll() {
  // Clear all tables
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

  testUserIds.push(resUsers.rows[0].id);
  testUserIds.push(resUsers.rows[1].id);

  testUserTokens.push(createToken({ id: testUserIds[0], 
    username: "alice", 
    email: "alice@example.com" }));

  testUserTokens.push(createToken({ id: testUserIds[1], 
    username: "bob", 
    email: "bob@example.com" }));


  // Insert test playlists
  const resPlaylists = await db.query(`
    INSERT INTO playlists (user_id, name, is_public)
    VALUES 
      ($1, 'Alice Public', TRUE),
      ($2, 'Bob Private', FALSE)
    RETURNING id`, [testUserIds[0], testUserIds[1]]);

  testPlaylistId = resPlaylists.rows[0].id;
  testPlaylistId2 = resPlaylists.rows[1].id;

  // Add songs to a playlist
  await db.query(`
    INSERT INTO playlist_songs (playlist_id, track_id, added_by)
    VALUES 
      ($1, $2, $3),
      ($1, $4, $3)`, [testPlaylistId, testTrackId, testUserIds[0], testTrackId2]);

  // Create a live listening session
  const resSession = await db.query(`
    INSERT INTO live_sessions (host_id, session_name, source_type, source_id, is_active)
    VALUES ($1, 'Test Session', 'playlist', $2, TRUE)
    RETURNING id`, [testUserIds[0], testPlaylistId]);

  testSessionId = resSession.rows[0].id;

  await db.query(`
    INSERT INTO live_session_users (session_id, user_id)
    VALUES ($1, $2)`, [testSessionId, testUserIds[0]]);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

afterAll(async function () {
  await teardown(db);
});


module.exports = {
  request,
  app,
  db,
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testUserIds,
  testUserTokens,
  testPlaylistId,
  testPlaylistId2,
  testTrackId,
  testTrackId2,
  testSessionId,
};
