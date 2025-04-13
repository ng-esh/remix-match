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
} = require("./_testCommonRoutes");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(async () => {
  await dbTeardown(db);
});



describe("POST /users/auth/register", () => {
  test("registers a new user", async () => {
    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "newuser",
        email: "new@user.com",
        password: "password123"
      });

    expect(resp.statusCode).toBe(201);
    expect(resp.body).toHaveProperty("token");
  });

  test("fails with missing fields", async () => {
    const resp = await request(app)
      .post("/auth/register")
      .send({ email: "bad", password: "123" });

    expect(resp.statusCode).toBe(400);
  });
});

describe("POST /users/auth/login", () => {
  test("logs in with correct credentials", async () => {
    const resp = await request(app)
      .post("/auth/login")
      .send({ email: "alice@example.com", password: "password1" });

    expect(resp.body).toHaveProperty("token");
  });

  test("fails with bad credentials", async () => {
    const resp = await request(app)
      .post("/auth/login")
      .send({ email: "alice@example.com", password: "nope" });

    expect(resp.statusCode).toBe(401);
  });
});

describe("GET /users/:userId", () => {
  test("gets user info if correct user", async () => {
    const resp = await request(app)
      .get(`/users/${testUserIds[0]}`)
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

describe("PATCH /users/:userId", () => {
  test("updates username", async () => {
    const resp = await request(app)
      .patch(`/users/${testUserIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`)
      .send({ username: "newname" });
    
    console.log(resp.body) 
    expect(resp.body.user.username).toBe("newname");
  });

  test("rejects if not authorized", async () => {
    const resp = await request(app)
      .patch(`/users/${testUserIds[1]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`)
      .send({ email: "bad@example.com" });

    expect(resp.statusCode).toBe(403);
  });

  test("rejects duplicate username", async () => {
    const resp = await request(app)
      .patch(`/users/${testUserIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`)
      .send({ username: "bob" }); // assuming bob already exists
  
    expect(resp.statusCode).toBe(400);
  });
  
});

describe("DELETE /users/:userId", () => {
  test("deletes own account", async () => {
    const resp = await request(app)
      .delete(`/users/${testUserIds[0]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(resp.body).toEqual({ deleted: testUserIds[0] });
  });

  test("rejects unauthorized delete", async () => {
    const resp = await request(app)
      .delete(`/users/${testUserIds[1]}`)
      .set("authorization", `Bearer ${testUserTokens[0]}`);

    expect(resp.statusCode).toBe(403);
  });

  test("rejects delete without token", async () => {
    const resp = await request(app)
      .delete(`/users/${testUserIds[0]}`);
  
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
