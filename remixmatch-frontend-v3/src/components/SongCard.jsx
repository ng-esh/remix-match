// components/SongCard.jsx

import React, { useState } from "react";
import ShareFormModal from "./ShareFormModal";
import "../styles/SongCard.css";

/**
 * SongCard Component
 *
 * Reusable display card for a Spotify track.
 * Can support both sharing and add-to-playlist behavior depending on props.
 *
 * Props:
 * - song: { id, name, artist, album, albumCover, spotifyUrl, previewUrl }
 * - showShare: boolean (optional) – if true, shows a Share button
 * - onAddToPlaylist: function (optional) – if provided, shows an Add button that calls this function with track ID
 */

function SongCard({ song, showShare = true, onAddToPlaylist = null }) {
  const { name, artist, album, albumCover, spotifyUrl, previewUrl, id } = song;
  const [showModal, setShowModal] = useState(false);

  console.log("🎧 Preview URL for track:", previewUrl);
  return (
    <div className="song-card">
      <img src={albumCover} alt={`${album} cover`} className="song-card-img" />

      <div className="song-card-info">
        <h3 className="song-card-title">{name}</h3>
        <p className="song-card-artist">{artist}</p>
        <p className="song-card-album">{album}</p>

        <div className="song-card-links">
          {previewUrl && (
            <audio controls src={previewUrl} className="song-preview" />
          )}

          {spotifyUrl && (
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="spotify-link"
            >
              Open in Spotify
            </a>
          )}

          {showShare && (
            <button className="share-btn" onClick={() => setShowModal(true)}>
              Share
            </button>
          )}

          {onAddToPlaylist && (
            <button className="add-btn" onClick={() => onAddToPlaylist(id)}>
              ➕ Add to Playlist
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <ShareFormModal songId={id} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default SongCard;
