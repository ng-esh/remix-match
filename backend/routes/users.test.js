// routes/users.test.js

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const dbTeardown = require("../tests/dbTeardown");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testUserIds,
  testUserTokens,
  testUsernames,
} = require("./_testCommonRoutes");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(async () => {
  await dbTeardown(db);
});

describe("GET /users/:username", () => {
  test("gets user info if correct user", async () => {
    const resp = await request(app)
      .get(`/username/${testUsernames[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(resp.body.user).toEqual(
      expect.objectContaining({
        id: testUserIds[0],
        username: "alice",
        email: "alice@example.com"
      })
    );
  });

  test("unauthorized if wrong user", async () => {
    const resp = await request(app)
      .get(`/users/${testUserIds[1]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(resp.statusCode).toBe(403);
  });

  test("rejects with invalid token", async () => {
    const resp = await request(app)
      .get(`/users/${testUserIds[0]}`)
      .set("authorization", `Bearer bad.token.here`);
  
    expect(resp.statusCode).toBe(401);
  });
  
});

describe("PATCH /users/:username", () => {
  test("updates username", async () => {
    const resp = await request(app)
      .patch(`/users/${testUsernames[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`)
      .send({ username: "newname" });
    
    expect(resp.body.user.username).toBe("newname");
  });

  test("rejects if not authorized", async () => {
    const resp = await request(app)
      .patch(`/users/${testUsernames[1]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`)
      .send({ username: "badname" });

    expect(resp.statusCode).toBe(403);
  });

  test("rejects duplicate username", async () => {
    const resp = await request(app)
      .patch(`/users/${testUsernames[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`)
      .send({ username: "bob" }); // assuming bob already exists
  
    expect(resp.statusCode).toBe(400);
  });
  
});

describe("DELETE /users/:username", () => {
  test("deletes own account", async () => {
    const resp = await request(app)
      .delete(`/users/${testUsernames[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(resp.body).toEqual({ deleted: testUsernames[0] });
  });

  test("rejects unauthorized delete", async () => {
    const resp = await request(app)
      .delete(`/users/${testUsernames[1]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(resp.statusCode).toBe(403);
  });

  test("rejects delete without token", async () => {
    const resp = await request(app)
      .delete(`/users/${testUsernames[0]}`);
  
    expect(resp.statusCode).toBe(401);
  });
  
});


describe("GET /search?query=", () => {
  test("searches by username", async () => {
    const resp = await request(app)
      .get(`/search?query=ali`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);
      
    expect(resp.statusCode).toBe(200);
    expect(Array.isArray(resp.body.users)).toBe(true);
    expect(resp.body.users.length).toBeGreaterThan(0);
    expect(resp.body.users[0]).toHaveProperty("username");
  });

  test("requires a query string", async () => {
    const resp = await request(app)
      .get(`/search`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

     
      expect(resp.statusCode).toBe(400);
  });
});

