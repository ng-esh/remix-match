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

    try {
      const res = await axios({ url, method, data, params, headers });
      return res.data;
    } catch (err) {
      console.error("API Error:", err.response);
      const message = err.response?.data?.error?.message || err.message;
      throw Array.isArray(message) ? message : [message];
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

  /** Get current user profile by username (if implemented) */
  static async getCurrentUser(username) {
    const res = await this.request(`users/username/${username}`);
    return res.user;
  }

  /** Search Spotify tracks */
  static async searchSpotify(query) {
    const res = await this.request("spotify/search", { q: query });
    return res.results;
  }

  /** Get songs the logged-in user has shared */
  static async getSentSongShares() {
    const res = await this.request("song-shares/sent"); // this route already exists in your backend
    return res.shares;
  }

  /** Get all votes by the logged-in user */
  static async getUserVotes() {
    const res = await this.request("votes/user");
    return res.votes;
  }

  /** Share a song with another user */
  static async shareSong(trackId, sharedWith, message) {
    const res = await this.request("shares", {
      trackId,         // must be called trackId
      sharedWith,
      playlistId: null, // if not sharing into a playlist
      message
    }, "post");
    return res.share;
  }

  /** Get playlists the logged-in user created */
  static async getMyPlaylists() {
    const res = await this.request("playlists");
    return res.playlists;
  }

  /** Get playlists shared with the logged-in user */
  static async getPlaylistsSharedWithMe(userId) {
    const res = await this.request(`playlist-shares/user/${userId}`);
    return res.sharedPlaylists;
  }







  // More playlist/song/share methods can go here
}

export default RemixMatchApi;

