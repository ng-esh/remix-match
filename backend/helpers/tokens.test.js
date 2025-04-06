// helpers/tokens.test.js

const jwt = require("jsonwebtoken");
const { createToken } = require("./tokens");
const { SECRET_KEY } = require("../config");

describe("createToken", () => {
  it("creates a valid JWT for user data", () => {
    const user = { id: 42, email: "alice@example.com" };
    const token = createToken(user);
    const payload = jwt.verify(token, SECRET_KEY);

    expect(payload).toEqual(
      expect.objectContaining({
        id: 42,
        email: "alice@example.com",
        iat: expect.any(Number)
      })
    );
  });

  it("includes any extra user fields (like isAdmin) if provided", () => {
    const user = { id: 7, email: "bob@example.com", isAdmin: true };
    const token = createToken(user);
    const payload = jwt.verify(token, SECRET_KEY);

    expect(payload).toEqual(
      expect.objectContaining({
        id: 7,
        email: "bob@example.com",
        isAdmin: true,
        iat: expect.any(Number)
      })
    );
  });

  it("throws error for invalid secret (simulated)", () => {
    const user = { id: 99, email: "spoof@example.com" };
    const token = createToken(user);

    // Modify the token slightly to invalidate it
    const badToken = token.replace(/\w$/, "x");

    expect(() => jwt.verify(badToken, SECRET_KEY)).toThrow();
  });
});
