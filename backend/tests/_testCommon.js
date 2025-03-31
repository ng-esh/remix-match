// tests/_testCommon.js

"use strict";

const db = require("./_testDb");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

// Store useful IDs for reference in tests
let testUserIds = [];
let testPlaylistIds = [];

async function commonBeforeAll() {
  // Clean out existing data
  await db.query("DELETE FROM playlist_songs");
  await db.query("DELETE FROM shared_playlists");
  await db.query("DELETE FROM votes");
  await db.query("DELETE FROM live_session_users");
  await db.query("DELETE FROM live_sessions");
  await db.query("DELETE FROM playlists");
  await db.query("DELETE FROM users");

  // Create test users
  const hashedPw1 = await bcrypt.hash("password1", BCRYPT_WORK_FACTOR);
  const hashedPw2 = await bcrypt.hash("password2", BCRYPT_WORK_FACTOR);

  const result = await db.query(
    `INSERT INTO users (username, password, email)
     VALUES ('user1', $1, 'user1@test.com'),
            ('user2', $2, 'user2@test.com')
     RETURNING id`,
    [hashedPw1, hashedPw2]
  );

  testUserIds.push(result.rows[0].id, result.rows[1].id);

  // Create a test playlist
  const playlistRes = await db.query(
    `INSERT INTO playlists (user_id, name, is_public)
     VALUES ($1, 'Chill Vibes', TRUE)
     RETURNING id`,
    [testUserIds[0]]
  );
  testPlaylistIds.push(playlistRes.rows[0].id);
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
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testPlaylistIds,
};
