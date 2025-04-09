const request = require("supertest");
const app = require("../app");
const db = require("../db");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testUserIds,
  testUserTokens,
  testPlaylistIds,
  testTrackId,
  testTrackId2
} = require("./_testCommonRoutes");

const dbTeardown = require("../tests/dbTeardown");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(async () => {
  await dbTeardown(db);
});

describe("POST /playlist-songs/:playlistId/songs", () => {
  test("adds a song to the playlist", async () => {
    const res = await request(app)
      .post(`/playlist-songs/${testPlaylistIds[0]}/songs`)
      .send({
        trackId: "spotify:track:newtrack123"
      })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.added).toEqual(
      expect.objectContaining({
        playlist_id: testPlaylistIds[0],
        track_id: "spotify:track:newtrack123",
        added_by: testUserIds[0],
      })
    );
  });

  test("fails if not logged in", async () => {
    const res = await request(app)
      .post(`/playlist-songs/${testPlaylistIds[0]}/songs`)
      .send({
        trackId: "spotify:track:anothertrack"
      });

    expect(res.statusCode).toBe(401);
  });
});

describe("DELETE /playlist-songs/:playlistId/songs/:trackId", () => {
  test("removes a song from the playlist", async () => {
    const res = await request(app)
      .delete(`/playlist-songs/${testPlaylistIds[0]}/songs/${testTrackId}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      removed: {
        playlist_id: testPlaylistIds[0],
        track_id: testTrackId
      }
    });
  });

  test("forbids user who does not own the playlist", async () => {
    const res = await request(app)
      .delete(`/playlist-songs/${testPlaylistIds[0]}/songs/${testTrackId}`)
      .set("authorization", `Bearer ${testUserTokens[1]}`);

    expect(res.statusCode).toBe(403);
  });
});

describe("GET /playlist-songs/:playlistId/songs", () => {
  test("retrieves songs from a playlist", async () => {
    const res = await request(app)
      .get(`/playlist-songs/${testPlaylistIds[0]}/songs`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.songs.length).toBeGreaterThan(0);
    expect(res.body.songs[0]).toHaveProperty("track_id");
    expect(res.body.songs[0]).toHaveProperty("added_by");
  });

  test("rejects unauthorized access", async () => {
    const res = await request(app)
      .get(`/playlist-songs/${testPlaylistIds[0]}/songs`);

    expect(res.statusCode).toBe(401);
  });
});

describe("PATCH /playlist-songs/:playlistId/songs/reorder", () => {
  test("reorders songs in a playlist", async () => {
    const res = await request(app)
      .patch(`/playlist-songs/${testPlaylistIds[0]}/songs/reorder`)
      .send({
        orderedTrackIds: [testTrackId2, testTrackId]
      })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.reordered.length).toBeGreaterThan(0);
  });

  test("rejects if unauthorized user attempts reorder", async () => {
    const res = await request(app)
      .patch(`/playlist-songs/${testPlaylistIds[0]}/songs/reorder`)
      .send({
        orderedTrackIds: [testTrackId2, testTrackId]
      })
      .set("authorization", `Bearer ${testUserTokens[1]}`);

    expect(res.statusCode).toBe(403);
  });
});

