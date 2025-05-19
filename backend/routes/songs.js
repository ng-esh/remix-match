const express = require("express");
const router = new express.Router();
const db = require("../db");
const Song = require("../models/song");
const { ensureLoggedIn } = require("../middleware/auth");
const { NotFoundError } = require("../expressError");

/**
 * GET /songs/user
 * 
 * Return all songs the user has interacted with, including:
 * - Songs they added to playlists
 * - Songs they shared with others
 * - Songs shared *to* them
 * 
 * Returns:
 *   [
 *     { track_id, name, artist, album, album_cover, spotify_url, preview_url },
 *     ...
 *   ]
 */
router.get("/user", ensureLoggedIn, async function (req, res, next) {
  try {
    const userId = res.locals.user.id;

    const result = await db.query(
      `SELECT DISTINCT ps.track_id
       FROM playlist_songs ps
       WHERE ps.added_by = $1

       UNION

       SELECT DISTINCT s.track_id
       FROM shares s
       WHERE s.shared_by = $1 OR s.shared_with = $1`,
      [userId]
    );

    const trackIds = result.rows.map(r => r.track_id);

    if (trackIds.length === 0) return res.json({ songs: [] });

    const songs = await Promise.all(
      trackIds.map(async (trackId) => {
        try {
          return await Song.findOrCreateBySpotifyId(trackId);
        } catch (err) {
          return null;
        }
      })
    );

    return res.json({ songs: songs.filter(Boolean) });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /songs/:id
 * 
 * Retrieve full details for a specific song by track ID.
 * Requires authentication.
 * 
 * Returns:
 *   { track_id, name, artist, album, album_cover, spotify_url, preview_url }
 */

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
      const song = await Song.findOrCreateBySpotifyId(req.params.id);
  
      // Handle null return explicitly (e.g., if model returns null)
      if (!song) throw new NotFoundError(`Track ID '${req.params.id}' not found`);
  
      return res.json({ song });
    } catch (err) {
      // Translate 3rd-party 404 (like Axios from Spotify) into NotFoundError
      if (err?.response?.status === 404) {
        return next(new NotFoundError(`Track ID '${req.params.id}' not found`));
      }
  
      return next(err); // Let other errors bubble up to global error handler
    }
  });
  

module.exports = router;
