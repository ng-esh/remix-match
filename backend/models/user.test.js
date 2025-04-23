// models/user.test.js

const db = require("../db");
const User = require("./user");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testUserIds
} = require("./_testCommon");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError
} = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);

describe("User.register", function () {
  test("successfully registers new user", async function () {
    const newUser = await User.register({
      username: "newbie",
      email: "newbie@test.com",
      password: "supersecret",
      firstName: "New",
      lastName: "User"
    });

    expect(newUser).toEqual(
      expect.objectContaining({
        username: "newbie",
        email: "newbie@test.com",
        firstName: "New",
        lastName: "User"
      })
    );
    expect(newUser).toHaveProperty("id");
    expect(newUser).toHaveProperty("created_at");
  });

  test("throws error on duplicate username", async function () {
    await expect(User.register({
      username: "user1", // already seeded
      email: "unique@test.com",
      password: "password",
      firstName: "Dupe",
      lastName: "Name"
    })).rejects.toThrow(BadRequestError);
  });

  test("throws error on duplicate email", async function () {
    await expect(User.register({
      username: "uniqueuser",
      email: "user1@test.com", // already seeded
      password: "password",
      firstName: "Dupe",
      lastName: "Email"
    })).rejects.toThrow(BadRequestError);
  });
});

describe("User.authenticate", function () {
  test("authenticates valid user", async function () {
    const user = await User.authenticate("user1", "password1");
    expect(user).toHaveProperty("username", "user1");
  });

  test("throws NotFoundError for unknown username", async function () {
    await expect(
      User.authenticate("ghost", "password")
    ).rejects.toThrow(NotFoundError);
  });

  test("throws UnauthorizedError for bad password", async function () {
    await expect(
      User.authenticate("user1", "wrongpass")
    ).rejects.toThrow(UnauthorizedError);
  });
});

describe("User.getById", function () {
  test("returns user if found", async function () {
    const user = await User.getById(testUserIds[0]);
    expect(user).toHaveProperty("username", "user1");
  });

  test("returns null if not found", async function () {
    const user = await User.getById(9999);
    expect(user).toBeNull();
  });
});

describe("User.getByUsername", function () {
  test("returns user if found", async function () {
    const user = await User.getByUsername("user1");
    expect(user).toHaveProperty("email", "user1@test.com");
  });

  test("returns null if not found", async function () {
    const user = await User.getByUsername("ghostuser");
    expect(user).toBeNull();
  });
});

describe("User.searchByUsername", function () {
  test("returns matching users by partial username", async function () {
    const results = await User.searchByUsername("user");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("username");
  });

  test("returns empty array if no match", async function () {
    const results = await User.searchByUsername("nonexistent");
    expect(results).toEqual([]);
  });
});


describe("User.updateByUsername", function () {
  test("successfully updates username", async function () {
    const updated = await User.updateByUsername("user1", { username: "newname" });
    expect(updated).toEqual(
      expect.objectContaining({
        username: "newname",
        email: "user1@test.com",
      })
    );
  });

  test("throws BadRequestError if username missing", async function () {
    await expect(User.updateByUsername("user1", {})).rejects.toThrow(BadRequestError);
  });

  test("throws NotFoundError if user not found", async function () {
    await expect(User.updateByUsername("ghostuser", { username: "ghost" })).rejects.toThrow(NotFoundError);
  });

  test("throws BadRequestError if username is taken", async function () {
    await expect(User.updateByUsername("user1", { username: "user2" })).rejects.toThrow(BadRequestError);
  });
});

describe("User.deleteByUsername", function () {
  test("successfully deletes user", async function () {
    const deletedUsername = await User.deleteByUsername("user1");
    expect(deletedUsername).toBe("user1");

    const user = await User.getByUsername("user1");
    expect(user).toBeNull();
  });

  test("throws NotFoundError if user not found", async function () {
    await expect(User.deleteByUsername("ghostuser")).rejects.toThrow(NotFoundError);
  });
});

