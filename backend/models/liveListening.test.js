// models/liveListening.test.js

const db = require("../db");
const LiveListening = require("./liveListening");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
} = require("./_testCommon");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let session;

describe("LiveListening.createSession", function () {
  test("creates a session", async function () {
    session = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Afrobeats Party",
      trackId: "spotify:track:afro123",
    });

    expect(session).toEqual(expect.objectContaining({
      host_id: testUserIds[0],
      session_name: "Afrobeats Party",
      track_id: "spotify:track:afro123",
      is_active: true,
    }));
  });

  test("throws BadRequestError on missing data", async function () {
    await expect(
      LiveListening.createSession({ sessionName: "Party" })
    ).rejects.toThrow(BadRequestError);
  });
});

describe("LiveListening.joinSession and leaveSession", function () {
  beforeEach(async function () {
    session = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Lo-fi Lounge",
      trackId: "spotify:track:lofi123",
    });
  });

  test("joins a session", async function () {
    const res = await LiveListening.joinSession(session.id, testUserIds[1]);
    expect(res).toEqual({ message: "Joined session successfully" });
  });

  test("throws ForbiddenError if session is inactive", async function () {
    await LiveListening.joinSession(session.id, testUserIds[0]);
    await LiveListening.leaveSession(session.id, testUserIds[0]);

    await expect(
      LiveListening.joinSession(session.id, testUserIds[1])
    ).rejects.toThrow(ForbiddenError);
  });

  test("user leaves session and ends it", async function () {
    await LiveListening.joinSession(session.id, testUserIds[0]);
    await LiveListening.leaveSession(session.id, testUserIds[0]);

    const sessions = await LiveListening.getActiveSessions();
    expect(sessions).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: session.id })])
    );
  });
});

describe("LiveListening.getUserActiveSessions", function () {
  test("returns empty array if user not in sessions", async function () {
    const sessions = await LiveListening.getUserActiveSessions(testUserIds[1]);
    expect(sessions).toEqual([]);
  });
});

describe("LiveListening.getHostSessions", function () {
  test("returns sessions for host", async function () {
    const newSession = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Study Beats",
      trackId: "spotify:track:study123",
    });

    const sessions = await LiveListening.getHostSessions(testUserIds[0]);
    expect(sessions[0]).toEqual(expect.objectContaining({
      session_name: "Study Beats",
    }));
  });
});

describe("LiveListening.endSession", function () {
  test("ends session if host", async function () {
    const newSession = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Host Only",
      trackId: "spotify:track:host123",
    });

    await LiveListening.endSession(newSession.id, testUserIds[0]);

    const hostSessions = await LiveListening.getHostSessions(testUserIds[0]);
    expect(hostSessions[0].is_active).toBe(false);
  });

  test("throws ForbiddenError if not host", async function () {
    const newSession = await LiveListening.createSession({
      hostId: testUserIds[0],
      sessionName: "Hosty McHostface",
      trackId: "spotify:track:hosty",
    });

    await expect(
      LiveListening.endSession(newSession.id, testUserIds[1])
    ).rejects.toThrow(ForbiddenError);
  });
});
