/**
 * Test suite for the Playlists API routes.
 *
 * This suite verifies the complete CRUD lifecycle for playlists,
 * including authorization and error handling. It includes:
 *
 * - Creating a playlist with valid data and user token
 * - Failing to create a playlist with missing data or without login
 * - Retrieving a playlist by ID
 * - Handling unauthorized access and invalid playlist IDs
 * - Updating a playlist name and visibility status by the owner
 * - Preventing updates with missing data, no token, or unauthorized users
 * - Deleting a playlist by the owner
 * - Ensuring deletion fails for unauthenticated or unauthorized users
 * - Validating behavior for non-existent playlist IDs
 *
 * All routes are protected by authentication and authorization middleware.
 */

const request = require("supertest");
const app = require("../app");
const db = require("../db");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testUserIds,
  testUserTokens,
} = require("./_testCommonRoutes");

const dbTeardown = require("../tests/dbTeardown");

let userToken;
let user2Token;
let testPlaylistId;

beforeAll(async () => {
  await commonBeforeAll();
  userToken = testUserTokens[0]; // alice
  user2Token = testUserTokens[1]; // bob
});

beforeEach(async () => {
  await commonBeforeEach();

  // Create a playlist for use in tests
  const createRes = await request(app)
    .post("/playlists")
    .send({ name: "Test Playlist", isPublic: true })
    .set("authorization", `Bearer ${userToken}`);

  testPlaylistId = createRes.body.playlist.id;
});

afterEach(commonAfterEach);
afterAll(async () => {
    await dbTeardown(db);
  });
  


describe("POST /playlists", () => {
  test("successfully creates a playlist", async () => {
    const res = await request(app)
      .post("/playlists")
      .send({ name: "Another Playlist", isPublic: true })
      .set("authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      playlist: {
        id: expect.any(Number),
        name: "Another Playlist",
        userId: testUserIds[0],
        isPublic: true,
        createdAt: expect.any(String),
      },
    });
    testPlaylistId = res.body.playlist.id;
  });

  test("fails with missing name", async () => {
    const res = await request(app)
      .post("/playlists")
      .send({ isPublic: false })
      .set("authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(400);
  });

  test("fails without login", async () => {
    const res = await request(app)
      .post("/playlists")
      .send({ name: "Unauthorized", isPublic: true });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /playlists/:id", () => {
  test("successfully gets a playlist", async () => {
    const res = await request(app)
      .get(`/playlists/${testPlaylistId}`)
      .set("authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      playlist: {
        id: testPlaylistId,
        name: "Test Playlist",
        userId: testUserIds[0],
        isPublic: true,
        songs: expect.any(Array),
      },
    });
  });

  test("fails without auth", async () => {
     // create a private playlist first
     const resCreate = await request(app)
        .post("/playlists")
        .send({ name: "Private One", isPublic: false })
        .set("authorization", `Bearer ${userToken}`);

    const privateId = resCreate.body.playlist.id;

    const res = await request(app).get(`/playlists/${privateId}`);
    expect(res.statusCode).toBe(401);
  });

  test("fails with invalid playlist id", async () => {
    const res = await request(app)
      .get("/playlists/0")
      .set("authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(404);
  });
});

describe("PATCH /playlists/:id", () => {
  test("successfully updates playlist name", async () => {
    const res = await request(app)
      .patch(`/playlists/${testPlaylistId}`)
      .send({ name: "Updated Playlist", isPublic: false })
      .set("authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      playlist: {
        id: testPlaylistId,
        name: "Updated Playlist",
        userId: testUserIds[0],
        isPublic: false,
      },
    });
  });

  test("fails with missing data", async () => {
    const res = await request(app)
      .patch(`/playlists/${testPlaylistId}`)
      .send({})
      .set("authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(400);
  });

  test("fails without auth", async () => {
    const res = await request(app)
      .patch(`/playlists/${testPlaylistId}`)
      .send({ name: "Should Fail" });
    expect(res.statusCode).toBe(401);
  });

  test("fails if not owner", async () => {
    const res = await request(app)
      .patch(`/playlists/${testPlaylistId}`)
      .send({ name: "Invalid Edit", isPublic: true })
      .set("authorization", `Bearer ${user2Token}`);
    expect(res.statusCode).toBe(403);
  });
});

describe("DELETE /playlists/:id", () => {
  test("successfully deletes a playlist", async () => {
    const res = await request(app)
      .delete(`/playlists/${testPlaylistId}`)
      .set("authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ deleted: testPlaylistId });
  });

  test("fails without login", async () => {
    const res = await request(app).delete(`/playlists/${testPlaylistId}`);
    expect(res.statusCode).toBe(401);
  });

  test("fails if not owner", async () => {
    const createRes = await request(app)
      .post("/playlists")
      .send({ name: "Owned by Alice", isPublic: true })
      .set("authorization", `Bearer ${userToken}`);
    const newId = createRes.body.playlist.id;

    const res = await request(app)
      .delete(`/playlists/${newId}`)
      .set("authorization", `Bearer ${user2Token}`);
    expect(res.statusCode).toBe(403);
  });

  test("fails with invalid id", async () => {
    const res = await request(app)
      .delete("/playlists/0")
      .set("authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(404);
  });
});
