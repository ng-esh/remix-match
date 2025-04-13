// routes/songShares.test.js

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
} = require("./_testCommonRoutes");

const dbTeardown = require("../tests/dbTeardown");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(async () => {
  await dbTeardown(db);
});

describe("POST /song-shares", () => {
  test("successfully shares a song with another user", async () => {
    const res = await request(app)
      .post("/song-shares")
      .send({
        sharedWith: testUserIds[1],
        playlistId: testPlaylistIds[0],
        trackId: testTrackId,
        message: "This is a great song!"
      })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.share).toEqual(
      expect.objectContaining({
        shared_by: testUserIds[0],
        shared_with: testUserIds[1],
        playlist_id: testPlaylistIds[0],
        track_id: testTrackId,
        message: "This is a great song!"
      })
    );
  });

  test("fails if not logged in", async () => {
    const res = await request(app)
      .post("/song-shares")
      .send({
        sharedWith: testUserIds[1],
        playlistId: testPlaylistIds[0],
        trackId: testTrackId,
        message: "Try this"
      });

    expect(res.statusCode).toBe(401);
  });

  test("fails with missing required fields", async () => {
    const res = await request(app)
      .post("/song-shares")
      .send({
        // missing sharedWith and/or trackId
        playlistId: testPlaylistIds[0],
        message: "Oops!"
      })
      .set("authorization", `Bearer ${testUserTokens[0]}`);
  
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/requires property/);
  });  

});

describe("GET /song-shares/received", () => {
  test("gets songs shared with logged-in user", async () => {
    // First, share a song
    await request(app)
      .post("/song-shares")
      .send({
        sharedWith: testUserIds[1],
        playlistId: testPlaylistIds[0],
        trackId: testTrackId,
        message: "From Alice to Bob"
      })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    const res = await request(app)
      .get("/song-shares/received")
      .set("authorization", `Bearer ${testUserTokens[1]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.shares.length).toBeGreaterThan(0);
    expect(res.body.shares[0]).toHaveProperty("track_id");
    expect(res.body.shares[0]).toHaveProperty("shared_by");
  });
});

describe("GET /song-shares/sent", () => {
  test("gets songs shared *by* logged-in user", async () => {
    await request(app)
    .post("/song-shares")
    .send({
      sharedWith: testUserIds[1],
      playlistId: testPlaylistIds[0],
      trackId: testTrackId,
      message: "sent by user"
    })
    .set("authorization", `Bearer ${testUserTokens[0]}`);

    const res = await request(app)
      .get("/song-shares/sent")
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.shares.length).toBeGreaterThan(0);
    expect(res.body.shares[0]).toHaveProperty("shared_with");
  });
});

describe("DELETE /song-shares/:id", () => {
    test("successfully deletes a share if authorized", async () => {
      // Alice shares a song with Bob
      const shareRes = await request(app)
        .post("/song-shares")
        .send({
          sharedWith: testUserIds[1],
          playlistId: testPlaylistIds[0],
          trackId: testTrackId,
          message: "Let's jam!"
        })
        .set("authorization", `Bearer ${testUserTokens[0]}`); // Alice = shared_by
  
      const shareId = shareRes.body.share.id;
      expect(typeof shareId).toBe("number");
  
      // Bob (shared_with) deletes the share
      const res = await request(app)
        .delete(`/song-shares/${shareId}`)
        .set("authorization", `Bearer ${testUserTokens[1]}`); // Bob = shared_with
  
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ deleted: `${shareId}` });
    });
  
    test("fails if unauthorized user tries to delete", async () => {
      // Alice shares a song with Bob
      const shareRes = await request(app)
        .post("/song-shares")
        .send({
          sharedWith: testUserIds[1],
          playlistId: testPlaylistIds[0],
          trackId: testTrackId,
          message: "Still vibing"
        })
        .set("authorization", `Bearer ${testUserTokens[0]}`); // Alice = shared_by
  
      const shareId = shareRes.body.share.id;
  
      // Carol (not involved) tries to delete it
      const res = await request(app)
        .delete(`/song-shares/${shareId}`)
        .set("authorization", `Bearer ${testUserTokens[2]}`); // Carol = neither
  
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/permission/i);
    });
  });
  