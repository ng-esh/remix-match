// models/liveListening.test.js

"use strict";

const db = require("../db");
const LiveListening = require("./liveListening");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../expressError");
const { commonBeforeAll, commonBeforeEach, commonAfterEach, testUserIds, testPlaylistIds } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);


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

describe("LiveListening.joinSession", () => {
  test("should not error on duplicate joins due to ON CONFLICT DO NOTHING", async () => {
    const session = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Duplicate Join Test",
      sourceType: "playlist",
      sourceId: `${testPlaylistIds[0]}`
    });

    const firstJoin = await LiveListening.joinSession(session.id, testUserIds[1]);
    expect(firstJoin).toEqual({ sessionId: session.id, userId: testUserIds[1] });

    const secondJoin = await LiveListening.joinSession(session.id, testUserIds[1]);
    expect(secondJoin).toEqual({ sessionId: session.id, userId: testUserIds[1] });
  });
})

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
    expect(msg).toEqual({ message: "Session ended successfully." });
  });

  test("throws ForbiddenError if not host", async () => {
    await expect(
      LiveListening.endSession(sessionId, testUserIds[1])
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("LiveListening.endSession", () => {
  test("ending an already-ended session should be handled gracefully", async () => {
    const session = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "End Twice",
      sourceType: "playlist",
      sourceId: `${testPlaylistIds[0]}`
    });

    await LiveListening.endSession(session.id, testUserIds[0]);
    const result = await LiveListening.endSession(session.id, testUserIds[0]);

    expect(result).toEqual({ message: "Session already inactive" });
  });
});

describe("LiveListening.getSessionById", () => {
  test("returns correct session by ID", async () => {
    const created = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "GetById Session",
      sourceType: "playlist",
      sourceId: `${testPlaylistIds[0]}`
    });

    // Make it public to match expected shape
    await db.query(`UPDATE live_sessions SET is_public = TRUE WHERE id = $1`, [created.id]);

    const session = await LiveListening.getSessionById(created.id);

    expect(session).toEqual(expect.objectContaining({
      id: created.id,
      host_id: testUserIds[0],
      session_name: "GetById Session",
      source_type: "playlist",
      source_id: `${testPlaylistIds[0]}`,
      is_active: true,
      is_public: true,
      created_at: expect.anything()
    }));
  });

  test("throws NotFoundError if session does not exist", async () => {
    await expect(LiveListening.getSessionById(0)).rejects.toThrow(NotFoundError);
  });
});

describe("LiveListening.getPublicSessions", () => {
  test("returns public and active sessions only", async () => {
    const session = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Public Session",
      sourceType: "playlist",
      sourceId: `${testPlaylistIds[0]}`
    });

    await db.query(`UPDATE live_sessions SET is_public = TRUE WHERE id = $1`, [session.id]);

    const sessions = await LiveListening.getPublicSessions();

    expect(sessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: session.id,
          host_id: testUserIds[0],
          host_username: expect.any(String), // ✅ <-- expect a host_username now
          session_name: "Public Session",
          is_active: true
        })
      ])
    );
  });

  test("returns empty array if no public sessions", async () => {
    await db.query(`UPDATE live_sessions SET is_public = FALSE`);
    const sessions = await LiveListening.getPublicSessions();
    expect(sessions).toEqual([]);
  });
});
