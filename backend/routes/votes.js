//  What this route file includes:
//  - POST /votes/:playlistId (cast a vote)
//  - GET /votes/:playlistId (get vote summary)
//  - DELETE /votes/:playlistId (remove a user's vote)
 
// routes/votes.js
"use strict";
const jsonschema = require("jsonschema");
const express = require("express");
const Vote = require("../models/vote");
const router = new express.Router();

const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const voteCastSchema = require("../schema/voteCast.json");


/** POST /votes/:playlistId
 * Cast or change a vote on a playlist.
 * Request body: { voteType } // 1 for upvote, -1 for downvote
 * Returns: { upvotes, downvotes, totalVotes }
 */
router.post("/:playlistId", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, voteCastSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    const voteType = req.body.voteType;
    const userId = res.locals.user.id;
    const playlistId = +req.params.playlistId;

    const voteSummary = await Vote.castVote({ userId, playlistId, voteType });
    return res.json(voteSummary);
  } catch (err) {
    return next(err);
  }
});

/** GET /user
 * Get all votes by the logged-in user
 * Returns: [{ playlist_id, vote_type, voted_at }, ...]
 */
router.get("/user", ensureLoggedIn, async function (req, res, next) {
  try {
    const userId = res.locals.user.id;
    const votes = await Vote.getUserVotes(userId);
    return res.json({ votes });
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
