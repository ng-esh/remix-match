// models/vote.test.js

const db = require("../db");
const Vote = require("./vote");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  
  testUserIds,
  testPlaylistIds,
} = require("./_testCommon");
const { BadRequestError, NotFoundError } = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);


describe("Vote.castVote", function () {
  test("casts an upvote", async function () {
    const result = await Vote.castVote({
      userId: testUserIds[0],
      playlistId: testPlaylistIds[0],
      voteType: 1,
    });

    expect(result).toEqual(expect.objectContaining({
      upvotes: expect.any(Number),
      downvotes: expect.any(Number),
      totalVotes: expect.any(Number),
    }));
  });

  test("changes a vote", async function () {
    await Vote.castVote({
      userId: testUserIds[0],
      playlistId: testPlaylistIds[0],
      voteType: 1,
    });

    const updated = await Vote.castVote({
      userId: testUserIds[0],
      playlistId: testPlaylistIds[0],
      voteType: -1,
    });

    expect(updated.downvotes).toBeGreaterThanOrEqual(1);
  });

  test("throws BadRequestError on invalid vote type", async function () {
    await expect(
      Vote.castVote({
        userId: testUserIds[0],
        playlistId: testPlaylistIds[0],
        voteType: 0,
      })
    ).rejects.toThrow(BadRequestError);
  });
});

describe("Vote.getPlaylistVotes", function () {
  test("gets current vote counts", async function () {
    await Vote.castVote({
      userId: testUserIds[1],
      playlistId: testPlaylistIds[0],
      voteType: 1,
    });

    const stats = await Vote.getPlaylistVotes(testPlaylistIds[0]);
    expect(stats).toEqual(expect.objectContaining({
      upvotes: expect.any(Number),
      downvotes: expect.any(Number),
      totalVotes: expect.any(Number),
    }));
  });
});

describe("Vote.removeVote", function () {
  test("removes a vote", async function () {
    await Vote.castVote({
      userId: testUserIds[0],
      playlistId: testPlaylistIds[0],
      voteType: 1,
    });

    await Vote.removeVote(testUserIds[0], testPlaylistIds[0]);

    const result = await Vote.getPlaylistVotes(testPlaylistIds[0]);
    expect(result.totalVotes).toBe(0);
  });

  test("throws NotFoundError if no vote exists", async function () {
    await expect(
      Vote.removeVote(testUserIds[0], testPlaylistIds[0])
    ).rejects.toThrow(NotFoundError);
  });
});