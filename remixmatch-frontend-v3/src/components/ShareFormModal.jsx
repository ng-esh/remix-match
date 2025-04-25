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

  async function handleSubmit(evt) {
    evt.preventDefault();
    setIsSubmitting(true);
    try {
      await RemixMatchApi.shareSong(songId, recipient, message);
      onClose();
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
