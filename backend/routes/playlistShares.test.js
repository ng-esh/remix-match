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
} = require("./_testCommonRoutes");

const dbTeardown = require("../tests/dbTeardown");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(async () => {
    await dbTeardown(db);
  });


  describe("POST /playlist-shares", () => {
    test("successfully shares a playlist", async () => {
      const res = await request(app)
        .post("/playlist-shares")
        .send({
          playlistId: testPlaylistIds[0],
          fromUserId: testUserIds[0],
          toUserId: testUserIds[1]
        })
        .set("authorization", `Bearer ${testUserTokens[0]}`);
  
      expect(res.statusCode).toBe(201);
      expect(res.body.shared).toEqual(
        expect.objectContaining({
        id: expect.any(Number),
        playlist_id: testPlaylistIds[0],
        from_user_id: testUserIds[0],
        to_user_id: testUserIds[1]
      }));
    });
  
    test("throws error if trying to share on someone else's behalf", async () => {
      const res = await request(app)
        .post("/playlist-shares")
        .send({
          playlistId: testPlaylistIds[0],
          fromUserId: testUserIds[0],
          toUserId: testUserIds[2]
        })
        .set("authorization", `Bearer ${testUserTokens[1]}`); // not fromUserId
  
      expect(res.statusCode).toBe(403);
    });
    
    test("fails with missing required fields", async () => {
      const res = await request(app)
        .post("/playlist-shares")
        .send({ playlistId: testPlaylistIds[0], fromUserId: testUserIds[0] }) // missing toUserId
        .set("authorization", `Bearer ${testUserTokens[0]}`);
  
      expect(res.statusCode).toBe(400);
    });
    
    test("fails if playlist already shared with user", async () => {
      // first share
      await request(app)
        .post("/playlist-shares")
        .send({
          playlistId: testPlaylistIds[0],
          fromUserId: testUserIds[0],
          toUserId: testUserIds[1]
        })
        .set("authorization", `Bearer ${testUserTokens[0]}`);
    
      // try sharing again
      const res = await request(app)
        .post("/playlist-shares")
        .send({
          playlistId: testPlaylistIds[0],
          fromUserId: testUserIds[0],
          toUserId: testUserIds[1]
        })
        .set("authorization", `Bearer ${testUserTokens[0]}`);
      expect(res.statusCode).toBe(400);
    });
    
  });
  
  describe("GET /playlist-shares/:playlistId/users", () => {
    test("gets users playlist was shared with", async () => {
      // First, share a playlist
      await request(app)
        .post("/playlist-shares")
        .send({
          playlistId: testPlaylistIds[0],
          fromUserId: testUserIds[0],
          toUserId: testUserIds[1]
        })
        .set("authorization", `Bearer ${testUserTokens[0]}`);
  
      const res = await request(app)
        .get(`/playlist-shares/${testPlaylistIds[0]}/users`)
        .set("authorization", `Bearer ${testUserTokens[0]}`);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
      expect(res.body.users[0]).toHaveProperty("id");
      expect(res.body.users[0]).toHaveProperty("username");
    });
  
    test("forbids access if not playlist owner", async () => {
      const res = await request(app)
        .get(`/playlist-shares/${testPlaylistIds[0]}/users`)
        .set("authorization", `Bearer ${testUserTokens[1]}`);
  
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe("GET /playlist-shares/user/:userId", () => {
    test("gets all playlists shared with a user", async () => {
      await request(app)
        .post("/playlist-shares")
        .send({
          playlistId: testPlaylistIds[1],
          fromUserId: testUserIds[0],
          toUserId: testUserIds[1]
        })
        .set("authorization", `Bearer ${testUserTokens[0]}`);
  
      const res = await request(app)
        .get(`/playlist-shares/user/${testUserIds[1]}`)
        .set("authorization", `Bearer ${testUserTokens[1]}`);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.playlists.length).toBeGreaterThan(0);
      expect(res.body.playlists[0]).toHaveProperty("id");
      expect(res.body.playlists[0]).toHaveProperty("name");
    });
  
    test("forbids access to shared playlists of another user", async () => {
      const res = await request(app)
        .get(`/playlist-shares/user/${testUserIds[1]}`)
        .set("authorization", `Bearer ${testUserTokens[0]}`);
  
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe("DELETE /playlist-shares/:shareId", () => {
    test("successfully deletes a share", async () => {
      const shareRes = await request(app)
        .post("/playlist-shares")
        .send({
          playlistId: testPlaylistIds[1],
          fromUserId: testUserIds[0],
          toUserId: testUserIds[1]
        })
        .set("authorization", `Bearer ${testUserTokens[0]}`);
  
      const shareId = shareRes.body.shared.id;
  
      const res = await request(app)
        .delete(`/playlist-shares/${shareId}`)
        .set("authorization", `Bearer ${testUserTokens[1]}`); // toUserId can delete
  
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Share removed" });
    });
  
    test("prevents unauthorized user from deleting share", async () => {
      const shareRes = await request(app)
        .post("/playlist-shares")
        .send({
          playlistId: testPlaylistIds[1],
          fromUserId: testUserIds[0],
          toUserId: testUserIds[1]
        })
        .set("authorization", `Bearer ${testUserTokens[0]}`);
  
      const shareId = shareRes.body.shared.id;
  
      const res = await request(app)
        .delete(`/playlist-shares/${shareId}`)
        .set("authorization", `Bearer ${testUserTokens[2]}`); // unrelated user
  
      expect(res.statusCode).toBe(403);
    });

    test("fails with invalid share ID", async () => {
      const res = await request(app)
        .delete("/playlist-shares/0")
        .set("authorization", `Bearer ${testUserTokens[0]}`);
    
      expect(res.statusCode).toBe(404);
    });
    
  });