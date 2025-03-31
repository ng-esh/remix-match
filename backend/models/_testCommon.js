// models/_testCommon.js

"use strict";

const db = require("../db");  // now correct relative path
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config"); // adjusted path

// Store useful IDs for reference in model tests
let testUserIds = [];
let testPlaylistIds = [];

async function commonBeforeAll() {
  // Clean out user-dependent tables first
  await db.query("DELETE FROM playlist_songs");
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

  // Create a test playlist for user1
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
