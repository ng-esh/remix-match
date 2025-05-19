// models/song.test.js

"use strict";

const db = require("../db");
const Song = require("./song");
const axios = require("axios");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
} = require("./_testCommon");
const { NotFoundError } = require("../expressError");

const dbTeardown = require("../tests/dbTeardown");

jest.mock("axios");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(async () => {
    await dbTeardown(db);
  });
  


describe("Song.findOrCreateBySpotifyId", () => {
  const sampleSpotifyTrack = {
    id: "test_track",
    name: "Test Song",
    artists: [{ name: "Test Artist" }],
    album: {
      name: "Test Album",
      images: [{ url: "http://testimage.com/cover.jpg" }]
    },
    external_urls: { spotify: "http://spotify.com/test" },
    preview_url: null, // force Deezer fallback
  };

  const sampleDeezerResponse = {
    data: [
      { preview: "http://deezer.com/preview.mp3" },
      { preview: null }
    ]
  };

  it("creates and returns song if not in DB", async () => {
    axios.post.mockResolvedValueOnce({
      data: { access_token: "mock_token", expires_in: 3600 }
    });

    axios.get
      .mockResolvedValueOnce({ data: sampleSpotifyTrack }) // Spotify track lookup
      .mockResolvedValueOnce({ data: sampleDeezerResponse }); // Deezer fallback

    const song = await Song.findOrCreateBySpotifyId("test_track");

    expect(song).toEqual(expect.objectContaining({
      track_id: "test_track",
      name: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      album_cover: "http://testimage.com/cover.jpg",
      spotify_url: "http://spotify.com/test",
      preview_url: "http://deezer.com/preview.mp3"
    }));

    const res = await db.query("SELECT * FROM songs WHERE track_id = 'test_track'");
    expect(res.rows.length).toBe(1);
  });

  it("returns existing song without calling APIs", async () => {
    axios.get.mockClear(); // Reset any previous API calls

    await db.query(
      `INSERT INTO songs
        (track_id, name, artist, album, album_cover, spotify_url, preview_url, preview_source)
       VALUES
        ('cached_id', 'Cached Song', 'Cached Artist', 'Cached Album', 'cover.jpg', 'url', 'preview.mp3', 'spotify')`
    );

    const song = await Song.findOrCreateBySpotifyId("cached_id");

    expect(song).toEqual(expect.objectContaining({
      track_id: "cached_id",
      name: "Cached Song"
    }));

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("handles Spotify not returning preview and Deezer also fails", async () => {
    axios.post.mockResolvedValueOnce({
      data: { access_token: "mock_token", expires_in: 3600 }
    });

    axios.get
      .mockResolvedValueOnce({ data: sampleSpotifyTrack })
      .mockRejectedValueOnce(new Error("Deezer API failed"));

    const song = await Song.findOrCreateBySpotifyId("no_preview_track");

    expect(song.preview_url).toBe(null);
    expect(song.name).toBe("Test Song");
  });

  it("throws error if Spotify track is invalid", async () => {
    axios.post.mockResolvedValueOnce({
      data: { access_token: "mock_token", expires_in: 3600 }
    });

    const error = new Error("Not Found");
    error.response = { status: 404 };
    axios.get.mockRejectedValueOnce(error);

    await expect(Song.findOrCreateBySpotifyId("bad_id"))
      .rejects.toThrow();
  });
});
