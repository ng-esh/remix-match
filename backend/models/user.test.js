// models/user.test.js

const db = require("../db");
const User = require("./user");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
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
afterAll(commonAfterAll);

describe("User.register", function () {
  test("successfully registers new user", async function () {
    const newUser = await User.register({
      username: "newbie",
      email: "newbie@test.com",
      password: "supersecret"
    });

    expect(newUser).toEqual(
      expect.objectContaining({
        username: "newbie",
        email: "newbie@test.com",
      })
    );
    expect(newUser).toHaveProperty("id");
    expect(newUser).toHaveProperty("created_at");
  });

  test("throws error on duplicate username", async function () {
    await expect(User.register({
      username: "user1", // already seeded
      email: "unique@test.com",
      password: "password"
    })).rejects.toThrow(BadRequestError);
  });

  test("throws error on duplicate email", async function () {
    await expect(User.register({
      username: "uniqueuser",
      email: "user1@test.com", // already seeded
      password: "password"
    })).rejects.toThrow(BadRequestError);
  });
});

describe("User.authenticate", function () {
  test("authenticates valid user", async function () {
    const user = await User.authenticate("user1@test.com", "password1");
    expect(user).toHaveProperty("username", "user1");
  });

  test("throws NotFoundError for unknown email", async function () {
    await expect(
      User.authenticate("ghost@test.com", "password")
    ).rejects.toThrow(NotFoundError);
  });

  test("throws UnauthorizedError for bad password", async function () {
    await expect(
      User.authenticate("user1@test.com", "wrongpass")
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
