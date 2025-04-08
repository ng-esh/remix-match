"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError, ForbiddenError, NotFoundError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  ensurePlaylistOwner,
  ensurePlaylistVisible
} = require("./auth");

const db = require("../db");
const { SECRET_KEY } = require("../config");
const teardown = require("../tests/dbTeardown");



const testJwt = jwt.sign({ id: 1, username: "user1" }, SECRET_KEY);
const badJwt = jwt.sign({ id: 1, username: "user1" }, "wrong");

let req, res, next;

beforeAll(async function () {
  await db.query("DELETE FROM users");
  await db.query(`
    INSERT INTO users (id, username, password, email)
    VALUES 
      (1, 'user1', 'password1', 'user1@example.com'),
      (2, 'user2', 'password2', 'user2@example.com')
    ON CONFLICT DO NOTHING
  `);
});

beforeEach(() => {
  req = {};
  res = { locals: {} };
  next = jest.fn();
});

describe("authenticateJWT", () => {
  test("adds user to res.locals if token valid", () => {
    req.headers = { authorization: `Bearer ${testJwt}` };
    authenticateJWT(req, res, next);
    expect(res.locals.user).toEqual(expect.objectContaining({
      id: 1,
      username: "user1",
      iat: expect.any(Number)
    }));
    expect(next).toHaveBeenCalled();
  });

  test("skips if no token", () => {
    req = { headers: {} };
    authenticateJWT(req, res, next);
    expect(res.locals.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});

describe("ensureLoggedIn", () => {
  test("passes if user is logged in", () => {
    res.locals.user = { id: 1 };
    ensureLoggedIn(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("calls next with UnauthorizedError if not logged in", () => {
    ensureLoggedIn(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe("ensureCorrectUser", () => {
  test("passes if IDs match", () => {
    res.locals.user = { id: 1 };
    req.params = { userId: "1" };
    ensureCorrectUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("calls next with ForbiddenError if IDs don't match", () => {
    res.locals.user = { id: 1 };
    req.params = { userId: "2" };
    ensureCorrectUser(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

describe("ensurePlaylistOwner", () => {
  test("calls next with NotFoundError if playlist doesn't exist", async () => {
    req.params = { playlistId: "0" };
    res.locals.user = { id: 1 }; // Ensure user is logged in
    await ensurePlaylistOwner(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});

describe("ensurePlaylistVisible", () => {
  test("allows access if playlist is public", async function () {
    const publicPlaylistRes = await db.query(
      `INSERT INTO playlists (user_id, name, is_public)
       VALUES (1, 'Public Test Playlist', TRUE)
       RETURNING id`
    );
    const playlistId = publicPlaylistRes.rows[0].id;

    req.params = { playlistId };
    res.locals.user = { id: 2 };
    await ensurePlaylistVisible(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("allows access if user is owner", async function () {
    const privatePlaylistRes = await db.query(
      `INSERT INTO playlists (user_id, name, is_public)
       VALUES (1, 'Private Test Playlist', FALSE)
       RETURNING id`
    );
    const playlistId = privatePlaylistRes.rows[0].id;

    req.params = { playlistId };
    res.locals.user = { id: 1 };
    await ensurePlaylistVisible(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("throws ForbiddenError if private and not owner", async function () {
    const privatePlaylistRes = await db.query(
      `INSERT INTO playlists (user_id, name, is_public)
       VALUES (1, 'Strictly Private', FALSE)
       RETURNING id`
    );
    const playlistId = privatePlaylistRes.rows[0].id;

    req.params = { playlistId };
    res.locals.user = { id: 2 };
    await ensurePlaylistVisible(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  test("throws NotFoundError if playlist doesn't exist", async function () {
    req.params = { playlistId: "0" };
    res.locals.user = { id: 1 };
    await ensurePlaylistVisible(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});

afterAll(async () => {
  await teardown(db);
});