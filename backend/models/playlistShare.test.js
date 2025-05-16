// models/playlistShare.test.js

const db = require("../db");
const Share = require("./playlistShare");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  testUserIds,
  testPlaylistIds,
} = require("./_testCommon");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);


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

  test("returns empty array if no playlists shared with user", async function () {
    const playlists = await Share.getSharedPlaylistsForUser(testUserIds[1]);
    expect(playlists).toEqual([]);
  });
  
});

describe("Share.removeShareIfAuthorized", function () {
  test("removes a shared playlist when user is authorized (receiver)", async function () {
    const share = await Share.sharePlaylist({
      playlistId: testPlaylistIds[0],
      fromUserId: testUserIds[0],
      toUserId: testUserIds[1],
    });

    await Share.removeShareIfAuthorized(share.id, testUserIds[1]);

    const result = await db.query(
      `SELECT * FROM shared_playlists WHERE id = $1`,
      [share.id]
    );
    expect(result.rows.length).toBe(0);
  });

  test("removes a shared playlist when user is authorized (sender)", async function () {
    const share = await Share.sharePlaylist({
      playlistId: testPlaylistIds[0],
      fromUserId: testUserIds[0],
      toUserId: testUserIds[1],
    });

    await Share.removeShareIfAuthorized(share.id, testUserIds[0]);

    const result = await db.query(
      `SELECT * FROM shared_playlists WHERE id = $1`,
      [share.id]
    );
    expect(result.rows.length).toBe(0);
  });

  test("throws ForbiddenError if user is neither sender nor receiver", async function () {
    const share = await Share.sharePlaylist({
      playlistId: testPlaylistIds[0],
      fromUserId: testUserIds[0],
      toUserId: testUserIds[1],
    });

    await expect(
      Share.removeShareIfAuthorized(share.id, testUserIds[2])
    ).rejects.toThrow(ForbiddenError);
  });

  test("throws NotFoundError if share doesn't exist", async function () {
    await expect(
      Share.removeShareIfAuthorized(999999, testUserIds[0])
    ).rejects.toThrow(NotFoundError);
  });
});



