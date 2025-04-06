//  What this route file includes:
//  - POST /votes/:playlistId (cast a vote)
//  - GET /votes/:playlistId (get vote summary)
//  - DELETE /votes/:playlistId (remove a user's vote)
 
// routes/votes.js
"use strict";

const express = require("express");
const router = new express.Router();
const { ensureLoggedIn } = require("../middleware/auth");
const Vote = require("../models/vote");
const { BadRequestError } = require("../expressError");


/** POST /votes/:playlistId
 * Cast or change a vote on a playlist.
 * Request body: { voteType } // 1 for upvote, -1 for downvote
 * Returns: { upvotes, downvotes, totalVotes }
 */
router.post("/:playlistId", ensureLoggedIn, async function (req, res, next) {
  try {
    const voteType = req.body.voteType;
    const userId = res.locals.user.id;
    const playlistId = +req.params.playlistId;

    const voteSummary = await Vote.castVote({ userId, playlistId, voteType });
    return res.json(voteSummary);
  } catch (err) {
    return next(err);
  }
});

/** GET /votes/:playlistId
 * Get the current vote count summary for a playlist.
 * Returns: { upvotes, downvotes, totalVotes }
 */
router.get("/:playlistId", ensureLoggedIn, async function (req, res, next) {
  try {
    const playlistId = +req.params.playlistId;
    const voteSummary = await Vote.getPlaylistVotes(playlistId);
    return res.json(voteSummary);
  } catch (err) {
    return next(err);
  }
});

/** DELETE /votes/:playlistId
 * Remove the logged-in user's vote on a playlist.
 * Returns: { message: "Vote removed" }
 */
router.delete("/:playlistId", ensureLoggedIn, async function (req, res, next) {
  try {
    const userId = res.locals.user.id;
    const playlistId = +req.params.playlistId;

    await Vote.removeVote(userId, playlistId);
    return res.json({ message: "Vote removed" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
