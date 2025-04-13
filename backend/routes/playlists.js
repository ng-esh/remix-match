// This route will include:
// - Creating a playlist (protected route)
// - Getting all public playlists
// - Getting all playlists by user
// - Searching playlists by name
// - Getting a single playlist by ID
// - Updating and deleting a playlist (owner-only)

// routes/playlists.js
"use strict";


const jsonschema = require("jsonschema");
const express = require("express");
const Playlist = require("../models/playlist");
const router = express.Router();

const { ensureLoggedIn, ensurePlaylistOwner, authenticateJWT } = require("../middleware/auth");
const { BadRequestError, ForbiddenError } = require("../expressError");
const playlistCreateSchema = require("../schema/playlistCreate.json");
const playlistUpdateSchema = require("../schema/playlistUpdate.json");
const playlistVisibilityUpdateSchema = require("../schema/playlistVisibilityUpdate.json");
const playlistSearchQuerySchema = require("../schema/playlistSearchQuery.json");



/**
 * GET / => { playlists }
 * 
 * Retrieves all playlists accessible to the logged-in user.
 * Includes both public playlists and those owned by the user.
 *
 * Authorization required: logged-in user
 */
router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const user = res.locals.user;
    const playlists = await Playlist.getAll(user?.id);
    return res.json({ playlists });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /search => { playlists }
 *
 * Performs a fuzzy search of public playlists by name.
 *
 * Query Params:
 * - name (string): search term
 *
 * Authorization required: logged-in user
 */
router.get("/search", ensureLoggedIn, async function (req, res, next) {
  try {
    const { name } = req.query;
    const validator = jsonschema.validate(req.query, playlistSearchQuerySchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    const playlists = await Playlist.getByName(name);
    return res.json({ playlists });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /:id => { playlist }
 *
 * Retrieves a single playlist by its ID.
 * Private playlists are only accessible by their owners.
 *
 * Authorization required: optional, but restricted for private playlists
 */
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const user = res.locals.user;
    const playlistId = req.params.id;

    if (isNaN(parseInt(playlistId))) {
      throw new BadRequestError("Playlist ID must be a number.");
    }

    const playlist = await Playlist.getById(playlistId);
    const formattedPlaylist = {
      id: playlist.id,
      name: playlist.name,
      userId: playlist.user_id,
      isPublic: playlist.is_public,
      songs: playlist.songs || []
    };
    
    if (!playlist.is_public && playlist.user_id !== user.id) {
      throw new ForbiddenError("Private playlist: access denied.");
    }
    

    return res.json({ playlist: formattedPlaylist });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST / => { playlist }
 *
 * Creates a new playlist for the logged-in user.
 *
 * Request body:
 * - name (string): name of the playlist
 * - isPublic (boolean): visibility setting
 *
 * Authorization required: logged-in user
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
     
    const { name, isPublic } = req.body;
    const userId = res.locals.user?.id;

    const validator = jsonschema.validate(req.body, playlistCreateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    

    const playlist = await Playlist.create({ userId, name, isPublic });
    return res.status(201).json({ playlist });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /:id => { playlist }
 *
 * Updates a playlist's name and/or visibility.
 *
 * Request body:
 * - name (string, optional): new name
 * - isPublic (boolean, optional): new visibility
 *
 * Authorization required: logged-in user and owner of playlist
 */
router.patch("/:id", ensureLoggedIn, ensurePlaylistOwner, async function (req, res, next) {
  try {
    const userId = res.locals.user.id;
    const { name, isPublic } = req.body;

    const validator = jsonschema.validate(req.body, playlistUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    const updated = await Playlist.update(req.params.id, userId, { name, isPublic });
    return res.json({
      playlist: {
        id: updated.id,
        name: updated.name,
        userId: updated.user_id,
        isPublic: updated.is_public,
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /:id/visibility => { playlist }
 *
 * Updates only the visibility of a playlist.
 *
 * Request body:
 * - isPublic (boolean): new visibility
 *
 * Authorization required: logged-in user and owner of playlist
 */
router.patch("/:id/visibility", ensureLoggedIn, ensurePlaylistOwner, async function (req, res, next) {
  try {
    const userId = res.locals.user.id;
    const { isPublic } = req.body;

    const validator = jsonschema.validate(req.body, playlistVisibilityUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    const playlist = await Playlist.update(req.params.id, userId, { isPublic });
    return res.json({ playlist:{
      id: playlist.id,
      name: playlist.name,
      userId: playlist.user_id,
      isPublic: playlist.is_public
    } });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /:id => { deleted: id }
 *
 * Deletes a playlist.
 *
 * Authorization required: logged-in user and owner of playlist
 */
router.delete("/:id", ensureLoggedIn, ensurePlaylistOwner, async function (req, res, next) {
  try {
    await Playlist.delete(req.params.id);
    return res.json({ deleted: +req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
