// components/AddToPlaylistModal.jsx

import React, { useEffect, useState, useContext } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import { UserContext } from "../context/UserContext";
import "../styles/AddToPlaylistModal.css";

/**
 * AddToPlaylistModal
 *
 * Props:
 * - trackId: Spotify track ID to add
 * - onClose: function to close modal
 * - onSuccess: callback to run after successful add
 */

function AddToPlaylistModal({ trackId, onClose, onSuccess }) {
  const { currentUser } = useContext(UserContext);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const userPlaylists = await RemixMatchApi.getMyPlaylists();
        setPlaylists(userPlaylists);
      } catch (err) {
        console.error("Failed to fetch playlists:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlaylists();
  }, [currentUser]);

  async function handleSubmit(evt) {
    evt.preventDefault();
    if (!selectedPlaylist) return;

    try {
      await RemixMatchApi.addSongToPlaylist(selectedPlaylist, trackId);
      setMessage("✅ Added to playlist!");
      if (onSuccess) onSuccess();
      setTimeout(onClose, 1000);
    } catch (err) {
      setMessage("❌ Failed to add song.");
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Select a Playlist</h3>
        {loading ? (
          <p>Loading playlists...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <select
              value={selectedPlaylist}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              required
            >
              <option value="">-- Choose Playlist --</option>
              {playlists.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button type="submit">Add</button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
            {message && <p className="modal-message">{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

export default AddToPlaylistModal;
