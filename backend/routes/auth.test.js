// routes/auth.test.js

"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");

const testUserData = {
  username: "testuser",
  email: "test@example.com",
  password: "password123"
};

beforeAll(async () => {
  await db.query("DELETE FROM users");
});

afterAll(async () => {
  await db.end();
});

describe("POST /auth/register", function () {
  test("successfully registers a new user and returns a token", async function () {
    const res = await request(app).post("/auth/register").send(testUserData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      token: expect.any(String),
    });
  });

  test("fails with missing data", async function () {
    const res = await request(app).post("/auth/register").send({
      username: "incomplete"
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /auth/token", function () {
  test("successfully logs in with correct credentials", async function () {
    const res = await request(app).post("/auth/token").send({
      email: testUserData.email,
      password: testUserData.password,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      token: expect.any(String),
    });
  });

  test("fails with incorrect credentials", async function () {
    const res = await request(app).post("/auth/token").send({
      email: testUserData.email,
      password: "wrongpassword",
    });
    expect(res.statusCode).toBe(401);
  });
});
