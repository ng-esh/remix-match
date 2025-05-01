/**
 * SharePlaylistForm
 *
 * Form for sharing a playlist with another user by username.
 */

import React, { useState } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/SharePlaylistForm.css";

function SharePlaylistForm({ playlistId, onClose }) {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(evt) {
    evt.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await RemixMatchApi.sharePlaylist({ playlistId, username });
      setMessage("Playlist shared successfully!");
    } catch (err) {
      setMessage("Failed to share playlist.");
      console.error(err);
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
