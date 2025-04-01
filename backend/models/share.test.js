// models/share.test.js

const db = require("../db");
const Share = require("./share");
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

describe("Share.sharePlaylist", function () {
  test("shares a playlist with another user", async function () {
    const result = await Share.sharePlaylist({
      playlistId: testPlaylistIds[0],
      fromUserId: testUserIds[0],
      toUserId: testUserIds[1],
    });

    expect(result).toEqual(expect.objectContaining({
      playlist_id: testPlaylistIds[0],
      from_user_id: testUserIds[0],
      to_user_id: testUserIds[1],
    }));
  });

  test("throws BadRequestError on duplicate share", async function () {
    await Share.sharePlaylist({
      playlistId: testPlaylistIds[0],
      fromUserId: testUserIds[0],
      toUserId: testUserIds[1],
    });

    await expect(
      Share.sharePlaylist({
        playlistId: testPlaylistIds[0],
        fromUserId: testUserIds[0],
        toUserId: testUserIds[1],
      })
    ).rejects.toThrow(BadRequestError);
  });
});

describe("Share.getSharedUsers", function () {
  test("gets users a playlist is shared with", async function () {
    await Share.sharePlaylist({
      playlistId: testPlaylistIds[0],
      fromUserId: testUserIds[0],
      toUserId: testUserIds[1],
    });

    const users = await Share.getSharedUsers(testPlaylistIds[0]);
    expect(users[0]).toEqual(expect.objectContaining({
      id: testUserIds[1],
      from_user_id: testUserIds[0]
    }));
  });

  test("throws NotFoundError if not shared with anyone", async function () {
    await expect(
      Share.getSharedUsers(testPlaylistIds[0])
    ).rejects.toThrow(NotFoundError);
  });
});

describe("Share.getSharedPlaylistsForUser", function () {
  test("gets all playlists shared with user", async function () {
    await Share.sharePlaylist({
      playlistId: testPlaylistIds[0],
      fromUserId: testUserIds[0],
      toUserId: testUserIds[1],
    });

    const playlists = await Share.getSharedPlaylistsForUser(testUserIds[1]);
    expect(playlists.length).toBe(1);
    expect(playlists[0]).toEqual(expect.objectContaining({
      id: testPlaylistIds[0],
      name: "Chill Vibes"
    }));
  });

  test("throws NotFoundError if no playlists shared with user", async function () {
    await expect(
      Share.getSharedPlaylistsForUser(testUserIds[1])
    ).rejects.toThrow(NotFoundError);
  });
});

describe("Share.removeSharedPlaylist", function () {
  test("removes a shared playlist", async function () {
    await Share.sharePlaylist({
      playlistId: testPlaylistIds[0],
      fromUserId: testUserIds[0],
      toUserId: testUserIds[1],
    });

    await Share.removeSharedPlaylist(testPlaylistIds[0], testUserIds[1]);

    await expect(
      Share.getSharedUsers(testPlaylistIds[0])
    ).rejects.toThrow(NotFoundError);
  });

  test("throws NotFoundError if playlist not shared", async function () {
    await expect(
      Share.removeSharedPlaylist(testPlaylistIds[0], testUserIds[1])
    ).rejects.toThrow(NotFoundError);
  });
});

