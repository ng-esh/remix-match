// models/liveListening.test.js

"use strict";

const db = require("../db");
const LiveListening = require("./liveListening");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../expressError");
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, testUserIds, testPlaylistIds } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("LiveListening.createSession", () => {
  test("creates a session", async () => {
    const session = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Evening Chill",
      sourceType: "playlist",
      sourceId: `${testPlaylistIds[0]}`
    });

    expect(session).toEqual({
      id: expect.any(Number),
      host_id: testUserIds[0],
      session_name: "Evening Chill",
      source_type: "playlist",
      source_id: `${testPlaylistIds[0]}`,
      is_active: true,
      created_at: expect.anything()
    });
  });

  test("throws BadRequestError on missing data", async () => {
    await expect(
      LiveListening.createSession({ hostId: testUserIds[0], sessionName: "", sourceType: "playlist" })
    ).rejects.toThrow(BadRequestError);
  });
});

describe("LiveListening.joinSession and leaveSession", () => {
  let sessionId;

  beforeEach(async () => {
    const session = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Group Session",
      sourceType: "track",
      sourceId: "spotify:track:123"
    });
    sessionId = session.id;
  });

  test("joins a session", async () => {
    const res = await LiveListening.joinSession(sessionId, testUserIds[1]);
    expect(res).toEqual({ sessionId, userId: testUserIds[1] });
  });

  test("throws ForbiddenError if session is inactive", async () => {
    await LiveListening.endSession(sessionId, testUserIds[0]);
    await expect(
      LiveListening.joinSession(sessionId, testUserIds[1])
    ).rejects.toThrow(ForbiddenError);
  });

  test("user leaves session and ends it", async () => {
    await LiveListening.leaveSession(sessionId, testUserIds[0]);
    const result = await db.query("SELECT is_active FROM live_sessions WHERE id = $1", [sessionId]);
    expect(result.rows[0].is_active).toBe(false);
  });
});

describe("LiveListening.getUserActiveSessions", () => {
  test("returns empty array if user not in sessions", async () => {
    const sessions = await LiveListening.getUserActiveSessions(testUserIds[1]);
    expect(sessions).toEqual([]);
  });
});

describe("LiveListening.getHostSessions", () => {
  test("returns sessions for host", async () => {
    await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Host Session",
      sourceType: "album",
      sourceId: "spotify:album:abc"
    });

    const sessions = await LiveListening.getHostSessions(testUserIds[0]);
    expect(sessions.length).toBeGreaterThan(0);
  });
});

describe("LiveListening.endSession", () => {
  let sessionId;

  beforeEach(async () => {
    const session = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "End Me",
      sourceType: "track",
      sourceId: "spotify:track:xyz"
    });
    sessionId = session.id;
  });

  test("ends session if host", async () => {
    const msg = await LiveListening.endSession(sessionId, testUserIds[0]);
    expect(msg).toBe("Session ended successfully.");
  });

  test("throws ForbiddenError if not host", async () => {
    await expect(
      LiveListening.endSession(sessionId, testUserIds[1])
    ).rejects.toThrow(ForbiddenError);
  });
});