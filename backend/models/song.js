// models/song.js

"use strict";

const db = require("../db");
const axios = require("axios");
const { NotFoundError } = require("../expressError");
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = require("../config");

let accessToken = null;
let tokenExpiresAt = 0;

/** Fetch or cache Spotify client credentials access token */
async function getSpotifyAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const resp = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  accessToken = resp.data.access_token;
  tokenExpiresAt = Date.now() + resp.data.expires_in * 1000;
  return accessToken;
}

/** Find or create song by Spotify track ID */
class Song {
  /** Look up by Spotify track ID, or fetch + store if missing */
  static async findOrCreateBySpotifyId(trackId) {
    // Step 1: Check if song already exists in DB
    const songRes = await db.query(
      `SELECT track_id, name, artist, album, album_cover, spotify_url, preview_url
       FROM songs
       WHERE track_id = $1`,
      [trackId]
    );

    if (songRes.rows[0]) {
      return songRes.rows[0];
    }

    // Step 2: Fetch from Spotify
    const token = await getSpotifyAccessToken();
    const spotifyRes = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const item = spotifyRes.data;

    let previewUrl = item.preview_url;
    let previewSource = "spotify";

    // Step 3: Fallback to Deezer if Spotify preview is null
    if (!previewUrl) {
      const trackName = encodeURIComponent(item.name);
      const artistName = encodeURIComponent(item.artists[0]?.name);
      const deezerQuery = `track:"${trackName}" artist:"${artistName}"`;

      try {
        const deezerRes = await axios.get(`https://api.deezer.com/search?q=${deezerQuery}`);
        const deezerTrack = deezerRes.data.data?.find(t => t.preview);
        if (deezerTrack) {
          previewUrl = deezerTrack.preview;
          previewSource = "deezer";
        }
      } catch (e) {
        console.warn("Deezer lookup failed:", e.message);
      }
    }

    // Step 4: Store in DB
    const insertRes = await db.query(
      `INSERT INTO songs 
         (track_id, name, artist, album, album_cover, spotify_url, preview_url, preview_source)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING track_id, name, artist, album, album_cover, spotify_url, preview_url`,
      [
        item.id,
        item.name,
        item.artists[0]?.name,
        item.album.name,
        item.album.images[0]?.url,
        item.external_urls.spotify,
        previewUrl,
        previewSource,
      ]
    );

    return insertRes.rows[0];
  }
}

module.exports = Song;
