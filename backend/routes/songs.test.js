// routes/songs.test.js

"use strict";

jest.mock("axios");

const request = require("supertest");
const axios = require("axios");
const app = require("../app");
const db = require("../db");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testUserTokens,
} = require("./_testCommonRoutes");
const dbTeardown = require("../tests/dbTeardown");

beforeAll(async () => {
  await commonBeforeAll();

  // Clean existing test song
  await db.query("DELETE FROM songs");

  // Insert a test song manually
  await db.query(`
    INSERT INTO songs
      (track_id, name, artist, album, album_cover, spotify_url, preview_url, preview_source)
    VALUES
      ('track_001', 'Test Song', 'Test Artist', 'Test Album', 'http://img.com/cover.jpg',
      'http://spotify.com/track_001', 'http://preview.com/snippet.mp3', 'spotify')
  `);

  const res = await db.query(`
    INSERT INTO playlists (user_id, name)
    VALUES ((SELECT id FROM users WHERE username = 'alice'), 'Alice Playlist')
    RETURNING id
  `);

  const playlistId = res.rows[0].id;

  await db.query(`
    INSERT INTO playlist_songs (playlist_id, track_id, added_by, position)
    VALUES ($1, 'track_001', (SELECT id FROM users WHERE username = 'alice'), 1)
  `, [playlistId]);

  await db.query(`
    INSERT INTO shares (shared_by, shared_with, playlist_id, track_id, message)
    VALUES (
      (SELECT id FROM users WHERE username = 'alice'),
      (SELECT id FROM users WHERE username = 'bob'),
      $1,
      'track_001',
      'Check this out!'
    )
  `, [playlistId]);
});

beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(async () => {
  await dbTeardown(db);
});

/** Tests for GET /songs/user */
describe("GET /songs/user", () => {
  it("returns songs user has interacted with", async () => {
    const res = await request(app)
      .get("/songs/user")
      .set("Authorization", `Bearer ${testUserTokens[0]}`); // alice

    expect(res.statusCode).toBe(200);
    expect(res.body.songs).toEqual([
      expect.objectContaining({
        track_id: "track_001",
        name: "Test Song",
        artist: "Test Artist"
      })
    ]);
  });

  it("returns songs shared to user", async () => {
    const res = await request(app)
      .get("/songs/user")
      .set("Authorization", `Bearer ${testUserTokens[1]}`); // bob

    expect(res.statusCode).toBe(200);
    expect(res.body.songs).toEqual([
      expect.objectContaining({ track_id: "track_001" })
    ]);
  });

  it("401 for unauthenticated request", async () => {
    const res = await request(app).get("/songs/user");
    expect(res.statusCode).toBe(401);
  });
});

/** Tests for GET /songs/:id */
describe("GET /songs/:id", () => {
  it("returns song details for valid ID", async () => {
    const res = await request(app)
      .get("/songs/track_001")
      .set("Authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.song).toEqual(expect.objectContaining({
      track_id: "track_001",
      name: "Test Song"
    }));
  });

  it("404 for non-existent track ID", async () => {
    axios.post.mockResolvedValueOnce({
      data: { access_token: "mock_token", expires_in: 3600 }
    });
  
    const notFoundError = new Error("Not Found");
    notFoundError.response = { status: 404 };
    axios.get.mockRejectedValueOnce(notFoundError);
  
    const res = await request(app)
      .get("/songs/nonexistent")
      .set("Authorization", `Bearer ${testUserTokens[0]}`);
  
    expect(res.statusCode).toBe(404);
  });
  

  
  it("401 if not logged in", async () => {
    const res = await request(app).get("/songs/track_001");
    expect(res.statusCode).toBe(401);
  });
});
