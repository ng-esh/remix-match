/**
 * ShareFormModal Component
 * 
 * Modal to share a song with another user and an optional message.
 */

import React, { useState } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/ShareFormModal.css";

function ShareFormModal({ songId, onClose }) {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);

  async function handleSubmit(evt) {
    evt.preventDefault();
    setIsSubmitting(true);
    setFormSuccess(null);

    // 🩹 Optional token re-sync (in case context failed to load it)
    if (!RemixMatchApi.token) {
      const storedToken = localStorage.getItem("remixmatch-token");
      if (storedToken) RemixMatchApi.setToken(storedToken);
    }

    try {
      // Step 1: Convert username to user ID using your search endpoint
      const recipientId = await RemixMatchApi.getUserIdByUsername(recipient);

      // Step 2: Share the song using recipient ID
      await RemixMatchApi.shareSong(songId, recipientId, message);

      // Step 3: Show success message then close
      setFormSuccess("✅ Song shared!");
      setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err) {
      console.error("Failed to share song:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="share-modal-backdrop">
      <div className="share-modal">
        <h2>Share this Song</h2>

        {formSuccess && (
          <div className="form-success">
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Share with (username):
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              required
            />
          </label>
          <label>
            Message (optional):
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </label>
          <div className="share-modal-buttons">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sharing..." : "Share"}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShareFormModal;
