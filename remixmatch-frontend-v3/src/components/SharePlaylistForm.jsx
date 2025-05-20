/**
 * SharePlaylistForm
 *
 * Form for sharing a playlist with another user by username.
 * Looks up the recipient user ID based on entered username,
 * and sends fromUserId and toUserId to the backend.
 */

import React, { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/SharePlaylistForm.css";

function SharePlaylistForm({ playlistId, onClose }) {
  const { currentUser } = useContext(UserContext);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(evt) {
    evt.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // 🔍 Step 1: Get recipient user ID by their username
      const userRes = await RemixMatchApi.getCurrentUser(username); // reused existing helper
      const toUserId = userRes.id;

      // 👤 Step 2: Use current user as the sender
      const fromUserId = currentUser.id;

      // 📤 Step 3: Send correct structure to backend
      await RemixMatchApi.sharePlaylist({
        playlistId, 
        fromUserId,
        toUserId
     });

      setMessage("Playlist shared successfully!");
    } catch (err) {
      console.error("❌ Failed to share playlist:", err);
      setMessage("Failed to share playlist.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="share-playlist-form" onSubmit={handleSubmit}>
      <label>
        Share with (username):
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <div className="form-buttons">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sharing..." : "Share"}
        </button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
      {message && <p className="form-message">{message}</p>}
    </form>
  );
}

export default SharePlaylistForm;
