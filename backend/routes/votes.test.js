// routes/votes.test.js

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testUserIds,
  testUserTokens,
  testPlaylistIds
} = require("./_testCommonRoutes");

const dbTeardown = require("../tests/dbTeardown");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(async () => {
  await dbTeardown(db);
});

describe("POST /votes/:playlistId", () => {
  test("casts an upvote", async () => {
    const res = await request(app)
      .post(`/votes/${testPlaylistIds[0]}`)
      .send({ voteType: 1 })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      upvotes: 1,
      downvotes: 0,
      totalVotes: 1
    });
  });

  test("changes an upvote to downvote", async () => {
    // First vote
    await request(app)
      .post(`/votes/${testPlaylistIds[0]}`)
      .send({ voteType: 1 })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    // Change vote
    const res = await request(app)
      .post(`/votes/${testPlaylistIds[0]}`)
      .send({ voteType: -1 })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      upvotes: 0,
      downvotes: 1,
      totalVotes: 1
    });
  });

  test("rejects invalid voteType", async () => {
    const res = await request(app)
      .post(`/votes/${testPlaylistIds[0]}`)
      .send({ voteType: 5 })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(400);
  });
});

describe("GET /votes/:playlistId", () => {
  test("gets correct vote summary", async () => {
    // Pre-cast a vote
    await request(app)
      .post(`/votes/${testPlaylistIds[0]}`)
      .send({ voteType: 1 })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    const res = await request(app)
      .get(`/votes/${testPlaylistIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      upvotes: 1,
      downvotes: 0,
      totalVotes: 1
    });
  });

  test("returns 0s for playlists with no votes", async () => {
    const res = await request(app)
      .get(`/votes/${testPlaylistIds[1]}`)
      .set("authorization", `Bearer ${testUserTokens[1]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      upvotes: 0,
      downvotes: 0,
      totalVotes: 0
    });
  });
});

describe("DELETE /votes/:playlistId", () => {
  test("removes a vote", async () => {
    // Cast vote first
    await request(app)
      .post(`/votes/${testPlaylistIds[0]}`)
      .send({ voteType: 1 })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    const res = await request(app)
      .delete(`/votes/${testPlaylistIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Vote removed" });

    // Confirm vote is gone
    const summary = await request(app)
      .get(`/votes/${testPlaylistIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(summary.body.totalVotes).toBe(0);
  });

  test("returns 404 if no vote to delete", async () => {
    const res = await request(app)
      .delete(`/votes/${testPlaylistIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens[1]}`);

    expect(res.statusCode).toBe(404);
  });
});

describe("Unauthorized access", () => {
    test("POST /votes/:playlistId → 401 if not logged in", async () => {
      const res = await request(app)
        .post(`/votes/${testPlaylistIds[0]}`)
        .send({ voteType: 1 });
  
      expect(res.statusCode).toBe(401);
    });
  
    test("GET /votes/:playlistId → 401 if not logged in", async () => {
      const res = await request(app)
        .get(`/votes/${testPlaylistIds[0]}`);
  
      expect(res.statusCode).toBe(401);
    });
  
    test("DELETE /votes/:playlistId → 401 if not logged in", async () => {
      const res = await request(app)
        .delete(`/votes/${testPlaylistIds[0]}`);
  
      expect(res.statusCode).toBe(401);
    });
  });

describe("Expired token access", () => {
    const expiredToken = jwt.sign(
      { id: testUserIds[0] },
      SECRET_KEY,
      { expiresIn: -10 } // already expired
    );
  
    test("POST /votes/:playlistId → 401 with expired token", async () => {
      const res = await request(app)
        .post(`/votes/${testPlaylistIds[0]}`)
        .send({ voteType: 1 })
        .set("authorization", `Bearer ${expiredToken}`);
  
      expect(res.statusCode).toBe(401);
    });
  
    test("GET /votes/:playlistId → 401 with expired token", async () => {
      const res = await request(app)
        .get(`/votes/${testPlaylistIds[0]}`)
        .set("authorization", `Bearer ${expiredToken}`);
  
      expect(res.statusCode).toBe(401);
    });
  
    test("DELETE /votes/:playlistId → 401 with expired token", async () => {
      const res = await request(app)
        .delete(`/votes/${testPlaylistIds[0]}`)
        .set("authorization", `Bearer ${expiredToken}`);
  
      expect(res.statusCode).toBe(401);
    });
  });