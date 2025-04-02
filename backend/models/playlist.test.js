// models/playlist.test.js

const db = require("../db");
const Playlist = require("./playlist");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testPlaylistIds
} = require("./_testCommon");
const {
  BadRequestError,
  NotFoundError
} = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Playlist.create", function () {
  test("creates a playlist successfully", async function () {
    const newPlaylist = await Playlist.create({
      userId: testUserIds[0],
      name: "Lo-Fi Mix",
      isPublic: true
    });

    expect(newPlaylist).toEqual(
      expect.objectContaining({
        user_id: testUserIds[0],
        name: "Lo-Fi Mix",
        is_public: true
      })
    );
  });

  test("throws BadRequestError if missing required fields", async function () {
    await expect(
      Playlist.create({ userId: testUserIds[0] }) // missing name
    ).rejects.toThrow(BadRequestError);
  });
});

describe("Playlist.getAll", function () {
  test("retrieves all public playlists", async function () {
    const playlists = await Playlist.getAll();
    expect(playlists.length).toBeGreaterThan(0);
    playlists.forEach(p => {
      expect(p).toHaveProperty("is_public", true);
    });
  });

  test("retrieves playlists by user ID", async function () {
    const playlists = await Playlist.getAll({ userId: testUserIds[0] });
    expect(playlists.length).toBeGreaterThan(0);
    playlists.forEach(p => {
      expect(p.user_id).toBe(testUserIds[0]);
    });
  });
});

describe("Playlist.getByName", function () {
  test("retrieves playlists matching partial name", async function () {
    const results = await Playlist.getByName("Chill");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toMatch(/Chill/i);
  });

  test("throws NotFoundError if no match found", async function () {
    await expect(Playlist.getByName("Unknown")).rejects.toThrow(NotFoundError);
  });
});

describe("Playlist.getById", function () {
  test("retrieves playlist by ID", async function () {
    const pl = await Playlist.getById(testPlaylistIds[0]);
    expect(pl).toHaveProperty("name", "Chill Vibes");
  });

  test("throws NotFoundError if not found", async function () {
    await expect(Playlist.getById(9999)).rejects.toThrow(NotFoundError);
  });
});

describe("Playlist.update", function () {
  test("updates playlist name and visibility", async function () {
    const updated = await Playlist.update(testPlaylistIds[0], {
      name: "Updated Name",
      isPublic: false
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: testPlaylistIds[0],
        name: "Updated Name",
        is_public: false
      })
    );
  });

  test("does not update visibility if not passed", async function () {
    const updated = await Playlist.update(testPlaylistIds[0], {
      name: "Name Only"  // no isPublic
    });
  
    expect(updated).toEqual(expect.objectContaining({
      id: testPlaylistIds[0],
      name: "Name Only",
      is_public: true // remains unchanged
    }));
  });
  
  test("throws NotFoundError if playlist not found", async function () {
    await expect(
      Playlist.update(9999, { name: "Nope" })
    ).rejects.toThrow(NotFoundError);
  });
});

describe("Playlist.delete", function () {
  test("deletes playlist", async function () {
    await Playlist.delete(testPlaylistIds[0]);

    const result = await db.query(
      `SELECT * FROM playlists WHERE id = $1`,
      [testPlaylistIds[0]]
    );
    expect(result.rows.length).toBe(0);
  });

  test("throws NotFoundError if playlist doesn't exist", async function () {
    await expect(Playlist.delete(9999)).rejects.toThrow(NotFoundError);
  });
});