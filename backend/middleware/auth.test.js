// middleware/auth.test.js

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  ensurePlaylistOwner,
} = require("./auth");
const { UnauthorizedError, ForbiddenError, NotFoundError } = require("../expressError");
const db = require("../db");

describe("authenticateJWT", function () {
  test("adds user to res.locals if token valid", function () {
    const token = jwt.sign({ id: 1, username: "user1" }, SECRET_KEY);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { locals: {} };
    const next = jest.fn();

    authenticateJWT(req, res, next);

    expect(res.locals.user).toEqual(expect.objectContaining({
      id: 1,
      username: "user1",
      iat: expect.any(Number),
    }));
    expect(next).toHaveBeenCalled();
  });

  test("skips if no token", function () {
    const req = { headers: {} };
    const res = { locals: {} };
    const next = jest.fn();

    authenticateJWT(req, res, next);
    expect(res.locals.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});

describe("ensureLoggedIn", function () {
  test("passes if user is logged in", function () {
    const req = {};
    const res = { locals: { user: { id: 1 } } };
    const next = jest.fn();

    ensureLoggedIn(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("calls next with UnauthorizedError if not logged in", function () {
    const req = {};
    const res = { locals: {} };
    const next = jest.fn();

    ensureLoggedIn(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe("ensureCorrectUser", function () {
  test("passes if IDs match", function () {
    const req = { params: { userId: "1" } };
    const res = { locals: { user: { id: 1 } } };
    const next = jest.fn();

    ensureCorrectUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("calls next with ForbiddenError if IDs don't match", function () {
    const req = { params: { userId: "2" } };
    const res = { locals: { user: { id: 1 } } };
    const next = jest.fn();

    ensureCorrectUser(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

describe("ensurePlaylistOwner", function () {
  test("calls next with NotFoundError if playlist doesn't exist", async function () {
    const req = { params: { id: "0" } };
    const res = { locals: { user: { id: 1 } } };
    const next = jest.fn();

    await ensurePlaylistOwner(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});