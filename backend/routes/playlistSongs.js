"use strict";

/** Routes for playlist songs: adding, removing, retrieving, reordering */

const jsonschema = require("jsonschema");
const express = require("express");
const router = new express.Router(); 
const PlaylistSong = require("../models/playlistSong");

const { ensureLoggedIn, ensurePlaylistOwner, ensurePlaylistVisible } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const playlistSongAddSchema = require("../schema/playlistSongAdd.json");
const playlistSongReorderSchema = require("../schema/playlistSongReorder.json");

/**
 * POST /:playlistId/songs
 * 
 * Add a song to a playlist.
 * 
 * Request body: { trackId, position }
 * Authorization: must be logged in & playlist owner
 * Returns: { id, playlist_id, track_id, added_by, position, added_at }
 */
router.post("/:playlistId/songs", ensureLoggedIn, ensurePlaylistOwner, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, playlistSongAddSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }

    const { trackId, position } = req.body;
    const playlistId = +req.params.playlistId;
    const userId = res.locals.user.id;

    const added = await PlaylistSong.addSongToPlaylist({ playlistId, trackId, userId, position });
    return res.status(201).json({ added });
  } catch (err) {
    return next(err);
  }
});


/**
 * DELETE /:playlistId/songs/:trackId
 * 
 * Remove a song from a playlist.
 * 
 * Authorization: must be logged in & playlist owner
 * Returns: { removed: { playlist_id, track_id } }
 */
router.delete("/:playlistId/songs/:trackId", ensureLoggedIn, ensurePlaylistOwner, async function (req, res, next) {
  try {
    const playlistId = +req.params.playlistId;
    const trackId = req.params.trackId;
    const userId = res.locals.user.id;

    const removed = await PlaylistSong.removeSongFromPlaylist(playlistId, trackId, userId);
    return res.json({ removed });
  } catch (err) {
    return next(err);
  }
});


/**
 * GET /:playlistId/songs
 * 
 * Get all songs in a playlist, ordered by position.
 * 
 * Authorization: must be logged in & playlist owner
 * Returns: [ { track_id, added_by, added_at, position }, ... ]
 */
router.get("/:playlistId/songs", ensureLoggedIn, ensurePlaylistVisible, async function (req, res, next) {
    try {
      const playlistId = +req.params.playlistId;
      const songs = await PlaylistSong.getSongsInPlaylist(playlistId);
      return res.json({ songs });
    } catch (err) {
      return next(err);
    }
  });

/**
 * PATCH /:playlistId/songs/reorder
 * 
 * Reorder songs in a playlist.
 * 
 * Request body: { orderedTrackIds: [trackId1, trackId2, ...] }
 * Authorization: must be logged in & playlist owner
 * Returns: [ { track_id, added_by, added_at, position }, ... ]
 */
router.patch("/:playlistId/songs/reorder", ensureLoggedIn, ensurePlaylistOwner, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, playlistSongReorderSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }

    const playlistId = +req.params.playlistId;
    const { orderedTrackIds } = req.body;

    const reordered = await PlaylistSong.reorderSongs(playlistId, orderedTrackIds);
    return res.json({ reordered });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
