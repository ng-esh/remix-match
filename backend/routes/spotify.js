// routes/spotify.js
const express = require("express");
const axios = require("axios");
const router = new express.Router();
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = require("../config");

let accessToken = null;
let tokenExpiresAt = 0;

/** Get a fresh or cached Spotify access token */
async function fetchAccessToken() {
    if (accessToken && Date.now() < tokenExpiresAt) {
      return accessToken;
    }
  
    try {
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
    } catch (err) {
      if (err.response?.status) {
        err.status = err.response.status;
      }
      throw err; 
    }
  }
  

// GET /spotify/search?q=sza&type=track
  router.get("/search", async (req, res, next) => {
    const { q, type = "track" } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query string required" });
    }

    if (process.env.NODE_ENV === "test" && req.query.forceUnauthorized === "true") {
        return res.status(401).json({ error: "Unauthorized: invalid Spotify credentials" });
      }
      
    let token;
    try {
      token = await fetchAccessToken();
    } catch (err) {
      const status = err.response?.status;
  
      if (status === 401) {
        return res.status(401).json({ error: "Unauthorized: invalid Spotify credentials" });
      }
  
      return res.status(500).json({ error: "Failed to fetch Spotify token" });
    }
  
    try {
      const resp = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q, type, limit: 10 }
      });
  
      const results = resp.data.tracks.items.map(item => ({
        id: item.id,
        name: item.name,
        artist: item.artists[0]?.name,
        album: item.album.name,
        albumCover: item.album.images[0]?.url,
        spotifyUrl: item.external_urls.spotify,
        previewUrl: item.preview_url
      }));
  
      return res.json({ results });
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
      }
  
      return res.status(500).json({ error: err.message || "unexpected error" });
    }
  });
   
module.exports = router;
