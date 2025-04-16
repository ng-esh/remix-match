// routes/spotify.test.js

const request = require("supertest");
const app = require("../app");
const axios = require("axios");

jest.mock("axios");

describe("GET /spotify/search", () => {
  const validToken = "test_token";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns search results with valid query", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: validToken,
        expires_in: 3600
      }
    });

    axios.get.mockResolvedValueOnce({
      data: {
        tracks: {
          items: [
            {
              id: "123",
              name: "Mock Song",
              artists: [{ name: "Mock Artist" }],
              album: {
                name: "Mock Album",
                images: [{ url: "https://mock.com/image.jpg" }]
              },
              external_urls: { spotify: "https://spotify.com/track/123" },
              preview_url: "https://mock.com/preview.mp3"
            }
          ]
        }
      }
    });

    const res = await request(app)
      .get("/spotify/search")
      .query({ q: "burna", type: "track" });

    expect(res.statusCode).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0]).toEqual({
      id: "123",
      name: "Mock Song",
      artist: "Mock Artist",
      album: "Mock Album",
      albumCover: "https://mock.com/image.jpg",
      spotifyUrl: "https://spotify.com/track/123",
      previewUrl: "https://mock.com/preview.mp3"
    });
  });

  test("returns 400 if query param is missing", async () => {
    const res = await request(app).get("/spotify/search");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/query/i);
  });

  test("returns 401 if Spotify token request is unauthorized (forced)", async () => {
    const res = await request(app)
      .get("/spotify/search")
      .query({ q: "burna", forceUnauthorized: "true" });
  
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/unauthorized/i);
  });
  

  
  test("returns 429 if Spotify rate limits us", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: validToken,
        expires_in: 3600
      }
    });

    axios.get.mockRejectedValueOnce({ response: { status: 429 } });

    const res = await request(app).get("/spotify/search").query({ q: "burna" });

    expect(res.statusCode).toBe(429);
    expect(res.body.error).toMatch(/rate limit/i);
  });

  test("returns 500 for unknown error", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: validToken,
        expires_in: 3600
      }
    });

    axios.get.mockRejectedValueOnce(new Error("unexpected"));

    const res = await request(app).get("/spotify/search").query({ q: "burna" });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/unexpected/i);
  });
});
