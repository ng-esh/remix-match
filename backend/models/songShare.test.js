"use strict";

const db = require("../db");
const SongShare = require("./songShare");
const { NotFoundError, ForbiddenError } = require("../expressError");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
 
  testUserIds,
  testPlaylistIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);


describe("SongShare.shareSong", function () {
  test("successfully shares a song", async function () {
    const result = await SongShare.shareSong({
      sharedBy: testUserIds[0],
      sharedWith: testUserIds[1],
      playlistId: testPlaylistIds[0],
      trackId: "spotify:track:123456",
      message: "This one's for you!"
    });

    expect(result).toEqual(expect.objectContaining({
      shared_by: testUserIds[0],
      shared_with: testUserIds[1],
      playlist_id: testPlaylistIds[0],
      track_id: "spotify:track:123456",
      message: "This one's for you!"
    }));
  });
});

describe("SongShare.getReceivedShares", function () {
  test("returns empty array if no shares", async function () {
    const shares = await SongShare.getReceivedShares(testUserIds[1]);
    expect(shares).toEqual([]);
  });
});

describe("SongShare.getSentShares", function () {
  test("returns empty array if no shares", async function () {
    const shares = await SongShare.getSentShares(testUserIds[0]);
    expect(shares).toEqual([]);
  });
});

describe("SongShare.deleteShare", function () {
  test("deletes a share", async function () {
    const share = await SongShare.shareSong({
      sharedBy: testUserIds[0],
      sharedWith: testUserIds[1],
      playlistId: testPlaylistIds[0],
      trackId: "spotify:track:del",
      message: "delete me"
    });

    await SongShare.deleteShare(share.id);

    const res = await db.query("SELECT * FROM shares WHERE id = $1", [share.id]);
    expect(res.rows.length).toEqual(0);
  });

  test("throws NotFoundError for non-existent share", async function () {
    try {
      await SongShare.deleteShare(99999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});