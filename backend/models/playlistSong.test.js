// models/playlistSong.test.js

const db = require("../db");
const PlaylistSong = require("./playlistSong");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testPlaylistIds,
} = require("./_testCommon");
const { BadRequestError, NotFoundError } = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("PlaylistSong.addSongToPlaylist", function () {
  test("adds a song to a playlist with correct position", async function () {
    const result = await PlaylistSong.addSongToPlaylist({
      playlistId: testPlaylistIds[0],
      trackId: "spotify:track:12345",
      userId: testUserIds[0]
    });

    expect(result).toEqual(expect.objectContaining({
      playlist_id: testPlaylistIds[0],
      track_id: "spotify:track:12345",
      position: expect.any(Number)
    }));
  });

  test("throws BadRequestError on duplicate song", async function () {
    await PlaylistSong.addSongToPlaylist({
      playlistId: testPlaylistIds[0],
      trackId: "spotify:track:12345",
      userId: testUserIds[0]
    });

    await expect(
      PlaylistSong.addSongToPlaylist({
        playlistId: testPlaylistIds[0],
        trackId: "spotify:track:12345",
        userId: testUserIds[0]
      })
    ).rejects.toThrow(BadRequestError);
  });
});

describe("PlaylistSong.removeSongFromPlaylist", function () {
  test("removes a song from a playlist", async function () {
    await PlaylistSong.addSongToPlaylist({
      playlistId: testPlaylistIds[0],
      trackId: "spotify:track:remove-me",
      userId: testUserIds[0]
    });

    const result = await PlaylistSong.removeSongFromPlaylist(
      testPlaylistIds[0],
      "spotify:track:remove-me",
      testUserIds[0]
    );

    expect(result).toEqual(expect.objectContaining({
      playlist_id: testPlaylistIds[0],
      track_id: "spotify:track:remove-me"
    }));
  });

  test("throws NotFoundError for missing song", async function () {
    await expect(
      PlaylistSong.removeSongFromPlaylist(
        testPlaylistIds[0],
        "spotify:track:ghost",
        testUserIds[0]
      )
    ).rejects.toThrow(NotFoundError);
  });
});

describe("PlaylistSong.getSongsInPlaylist", function () {
  test("returns all trackIds for a playlist in correct order", async function () {
    await PlaylistSong.addSongToPlaylist({
      playlistId: testPlaylistIds[0],
      trackId: "spotify:track:alpha",
      userId: testUserIds[0]
    });

    await PlaylistSong.addSongToPlaylist({
      playlistId: testPlaylistIds[0],
      trackId: "spotify:track:beta",
      userId: testUserIds[0]
    });

    const songs = await PlaylistSong.getSongsInPlaylist(testPlaylistIds[0]);
    expect(songs.map(s => s.track_id)).toEqual([
      "spotify:track:alpha",
      "spotify:track:beta"
    ]);
  });

  test("throws NotFoundError if no songs in playlist", async function () {
    const newPlaylistRes = await db.query(
      `INSERT INTO playlists (user_id, name, is_public)
       VALUES ($1, 'Empty Playlist', TRUE)
       RETURNING id`,
      [testUserIds[0]]
    );

    await expect(
      PlaylistSong.getSongsInPlaylist(newPlaylistRes.rows[0].id)
    ).rejects.toThrow(NotFoundError);
  });
});

describe("PlaylistSong.reorderSongs", function () {
  test("reorders songs within a playlist", async function () {
    await PlaylistSong.addSongToPlaylist({
      playlistId: testPlaylistIds[0],
      trackId: "spotify:track:one",
      userId: testUserIds[0]
    });

    await PlaylistSong.addSongToPlaylist({
      playlistId: testPlaylistIds[0],
      trackId: "spotify:track:two",
      userId: testUserIds[0]
    });

    await PlaylistSong.reorderSongs(testPlaylistIds[0], [
      "spotify:track:two",
      "spotify:track:one"
    ]);

    const songs = await PlaylistSong.getSongsInPlaylist(testPlaylistIds[0]);
    expect(songs.map(s => s.track_id)).toEqual([
      "spotify:track:two",
      "spotify:track:one"
    ]);
  });

  test("throws BadRequestError if playlistId or order array is missing", async function () {
    await expect(
      PlaylistSong.reorderSongs(null, [])
    ).rejects.toThrow(BadRequestError);

    await expect(
      PlaylistSong.reorderSongs(testPlaylistIds[0], null)
    ).rejects.toThrow(BadRequestError);
  });
});
