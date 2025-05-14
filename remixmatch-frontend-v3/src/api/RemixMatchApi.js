/**
 * RemixMatchApi
 * 
 * A static class for centralizing all API calls to the backend.
 * 
 * What this class does:
 * - Provides helper methods for auth, playlists, users, shares, etc.
 * - Uses axios under the hood to send HTTP requests.
 * - Includes shared token logic and error handling.
 * - Keeps API logic separate from frontend UI logic.
 */


import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

class RemixMatchApi {
  static token;

  /** Set JWT token to use for requests */
  static setToken(token) {
    RemixMatchApi.token = token;
  }

  /** General-purpose request method */
  static async request(endpoint, data = {}, method = "get") {
    const url = `${BASE_URL}/${endpoint}`;
    const headers = RemixMatchApi.token
      ? { Authorization: `Bearer ${RemixMatchApi.token}` }
      : {};

    const params = method === "get" ? data : {};

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await axios({ url, method, data, params, headers });
        return res.data;
      } catch (err) {
        const status = err?.response?.status;

        // Only retry for specific temporary network issues (502/503/504 or no status)
        const canRetry = !status || [502, 503, 504].includes(status);

        if (attempt === 1 || !canRetry) {
          console.error("API Error:", err.response);
          const message = err.response?.data?.error?.message || err.response?.data?.error || err.message;
          throw Array.isArray(message) ? message : [message];
        }
        // Else, retry once automatically
      }
    }
  }

  /** =====================
   *  AUTH
   *  ===================== */

  /** Log in with email & password -> returns token */
  static async login({ username, password }) {
    const res = await this.request("auth/login", { username, password }, "post");
    return res.token;
  }

  /** Register new user with userData -> returns token */
  static async signup(userData) {
    // userData should include: username, email, password, firstName, lastName
    const res = await this.request("auth/register", userData, "post");
    return res.token;
  }

   /** =====================
   *  USERS
   *  ===================== */

  /** Get current user profile by username  */
  static async getCurrentUser(username) {
    const res = await this.request(`users/username/${username}`);
    return res.user;
  }

  /** Get user ID by exact username using fuzzy search */
  static async getUserIdByUsername(username) {
    const res = await this.request(`search?query=${username}`);
    const match = res.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!match) throw new Error("User not found");
    return match.id;
  }

   /** =====================
   *  SPOTIFY
   *  ===================== */

  /** Search Spotify tracks */
  static async searchSpotify(query) {
    const res = await this.request("spotify/search", { q: query });
    return res.results;
  }

  /** Get full song details from Spotify by track ID */
  static async getSpotifyTrackById(trackId) {
    const res = await this.request(`spotify/track/${trackId}`);
    return res.track;
  }

  /** Get full track metadata from Spotify by track ID */
  static async getSpotifyTrackById(trackId) {
    const res = await this.request(`spotify/track/${trackId}`);
    return res.track;
  }


  /** =====================
   *  SONG-SHARE
   *  ===================== */

  /** Get songs the logged-in user has shared */
  static async getSentSongShares() {
    const res = await this.request("song-shares/sent"); // this route already exists in your backend
    return res.shares;
  }

  /** Share a song with another user */
  static async shareSong(trackId, sharedWith, message) {
    const res = await this.request("song-shares", {
      trackId,         // must be called trackId
      sharedWith,
      playlistId: null, // if not sharing into a playlist
      message
    }, "post");
    return res.share;
  }

   /** =====================
   *  PLAYLISTS
   *  ===================== */

  /** Create a new playlist */
  static async createPlaylist(data) {
    const res = await this.request("playlists", data, "post");
    return res.playlist; // ⬅️ IMPORTANT
  }

  /** Get playlists the logged-in user created */
  static async getMyPlaylists() {
    const res = await this.request("playlists");
    return res.playlists;
  }

  /** Get a playlist's details by ID */
  static async getPlaylistById(playlistId) {
    const res = await this.request(`playlists/${playlistId}`);
    return res.playlist;
  }

  /** Update playlist name */
  static async updatePlaylistName(playlistId, newName) {
    const res = await this.request(`playlists/${playlistId}`, { name: newName }, "patch");
    return res.playlist;
  }

  /** Delete a playlist by ID */
  static async deletePlaylist(playlistId) {
    const res = await this.request(`playlists/${playlistId}`, {}, "delete");
    return res.deleted;
  }

  // Toggle playlist visibility
  static async updatePlaylistVisibility(playlistId, isPublic) {
    const res = await this.request(`playlists/${playlistId}/visibility`, { isPublic }, "patch");
    return res.playlist;
  }

   /** =====================
   *  PLAYLIST-SHARE
   *  ===================== */

  /** Get playlists shared with the logged-in user */
  static async getPlaylistsSharedWithMe(userId) {
    const res = await this.request(`playlist-shares/user/${userId}`);
    return res.sharedPlaylists;
  }

  /** Share a playlist with another user by username */
  static async sharePlaylist({ playlistId, username }) {
    const res = await this.request(`playlist-shares`, {
      playlistId,
      username,
    }, "post");
    return res.share;
  }

   /** =====================
   *  PLAYLIST-SONG
   *  ===================== */

  /** Add a song to a playlist */
  static async addSongToPlaylist(playlistId, trackId) {
    const res = await this.request(
      `playlist-songs/${playlistId}/songs`,
      { trackId },
      "post"
    );
    return res.added;
  }

  /** Get songs inside a playlist */
  static async getSongsInPlaylist(playlistId) {
    const res = await this.request(`playlist-songs/${playlistId}/songs`);
    return res.songs;
  }

  /** Remove a song from a playlist */
  static async removeSongFromPlaylist(playlistId, songId) {
    await this.request(`playlist-songs/${playlistId}/${songId}`, {}, "delete");
  }

  /** Reorder songs in a playlist using Spotify track IDs */
  static async reorderPlaylistSongs(playlistId, orderedTrackIds) {
    const res = await this.request(
      `playlist-songs/${playlistId}/songs/reorder`,
      { orderedTrackIds },
      "patch"
    );
    return res.reordered;
  }

   /** =====================
   *  LIVES
   *  ===================== */

  /** Get all public live listening sessions */
  static async getPublicSessions() {
    const res = await this.request("lives/public");
    return res.sessions;
  }

  /** Create a new live listening session */
  static async createLiveSession(data) {
    const res = await this.request("lives/create", data, "post");
    return res.session;
  }

  /** Get details for a specific session */
  static async getSessionById(sessionId) {
    const res = await this.request(`lives/${sessionId}`); 
    return res.session;
  }
  

  /** =====================
   *  VOTES
   *  ===================== */

  /** Get all votes by the logged-in user */
  static async getUserVotes() {
    const res = await this.request("votes/user");
    return res.votes;
  }

  /** Get vote totals for a playlist */
  static async getPlaylistVotes(playlistId) {
    const res = await this.request(`votes/${playlistId}`);
    return res;
  }

  /** Cast a vote (1 for upvote, -1 for downvote) */
  static async castVote(playlistId, voteType) {
    return await this.request(`votes/${playlistId}`, { voteType }, "post");
  }

  /** Remove vote */
  static async removeVote(playlistId) {
    return await this.request(`votes/${playlistId}`, {}, "delete");
  }

  // More playlist/song/share methods can go here
}

export default RemixMatchApi;

