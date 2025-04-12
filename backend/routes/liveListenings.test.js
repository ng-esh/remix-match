// routes/liveListenings.test.js

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const db = require("../db");
const { SECRET_KEY } = require("../config");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testUserIds,
  testUserTokens,
  testPlaylistIds,
} = require("./_testCommonRoutes");

let testSessionId;

const dbTeardown = require("../tests/dbTeardown");

beforeAll(commonBeforeAll);
beforeEach(async () => {
    await commonBeforeEach();
  
     // Ensure "Test Session" exists
    const res = await db.query(`
      SELECT id FROM live_sessions
      WHERE session_name = 'Test Session'
      LIMIT 1
    `);
  
    testSessionId = res.rows[0]?.id;
  
    if (!testSessionId) {
      throw new Error("❌ Could not find 'Test Session' for live listening tests.");
    }
    // Make sure it's public so the public tests don't fail
    await db.query(`UPDATE live_sessions SET is_public = TRUE WHERE id = $1`, [testSessionId]);
  });
afterEach(commonAfterEach);
afterAll(async () => {
  await dbTeardown(db);
});

describe("POST /lives/create", () => {
  test("creates a live session", async () => {
    const res = await request(app)
      .post("/lives/create")
      .send({
        sessionName: "Party Time",
        sourceType: "playlist",
        sourceId: testPlaylistIds[0],
        isPublic: true
      })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.session).toHaveProperty("id");
    expect(res.body.session).toHaveProperty("session_name", "Party Time");
  });

  test("rejects if token is expired", async () => {
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzA1MjQwMDAwLCJleHAiOjE3MDUyNDAwMDB9.vGp91pi-7bNdJ6YPJqz7ipgxgC0p6-KTDXym2G66VR4";

    const res = await request(app)
      .post("/lives/create")
      .send({
        sessionName: "Expired Session",
        sourceType: "playlist",
        sourceId: testPlaylistIds[0]
      })
      .set("authorization", `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/logged in/i);
  });
});

describe("POST /lives/:sessionId/invite-token", () => {
  test("generates a private invite token", async () => {
    const res = await request(app)
      .post(`/lives/${testSessionId}/invite-token`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");

    const payload = jwt.verify(res.body.token, SECRET_KEY);
    expect(payload.sessionId).toEqual(testSessionId);
  });
});

describe("POST /lives/join/:token", () => {
  test("joins a session using private token", async () => {
    const token = jwt.sign({ sessionId: testSessionId }, SECRET_KEY, { expiresIn: "30m" });

    const res = await request(app)
      .post(`/lives/join/${token}`)
      .set("authorization", `Bearer ${testUserTokens[1]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      sessionId: testSessionId,
      userId: testUserIds[1]
    });
  });
});

describe("POST /lives/:sessionId/join", () => {
  test("joins a public session by ID", async () => {
    const res = await request(app)
      .post(`/lives/${testSessionId}/join`)
      .set("authorization", `Bearer ${testUserTokens[1]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/joined session/i);
  });

  test("forbids joining private session without invite", async () => {
    const privateSessionRes = await request(app)
      .post("/lives/create")
      .send({
        sessionName: "Private Jam",
        sourceType: "playlist",
        sourceId: testPlaylistIds[0],
        isPublic: false
      })
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    const privateId = privateSessionRes.body.session.id;

    const res = await request(app)
      .post(`/lives/${privateId}/join`)
      .set("authorization", `Bearer ${testUserTokens[1]}`);

    expect(res.statusCode).toBe(403);
  });
});

describe("GET /lives/public", () => {
  test("gets all public sessions", async () => {
    const res = await request(app)
      .get("/lives/public")
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.sessions.length).toBeGreaterThan(0);
  });
});

describe("GET /lives/me", () => {
  test("gets sessions user is part of", async () => {
    const res = await request(app)
      .get("/lives/me")
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
  });
});

describe("GET /lives/host", () => {
  test("gets sessions hosted by user", async () => {
    const res = await request(app)
      .get("/lives/host")
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.sessions[0]).toHaveProperty("host_id", testUserIds[0]);
  });
});

describe("PATCH /lives/:sessionId/end", () => {
  test("ends a session if host", async () => {
    const res = await request(app)
      .patch(`/lives/${testSessionId}/end`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({message: "Session ended successfully."});
  });

  test("forbids non-host from ending a session", async () => {
    const res = await request(app)
      .patch(`/lives/${testSessionId}/end`)
      .set("authorization", `Bearer ${testUserTokens[1]}`);

    expect(res.statusCode).toBe(403);
  });
});
