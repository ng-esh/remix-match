import React, { useState } from "react";
import ShareFormModal from "./ShareFormModal";
import "../styles/SongCard.css";

function SongCard({ song, showShare = true, onAddToPlaylist = null }) {
  const {
    id,
    name,
    artist,
    album,
    albumCover,
    spotifyUrl,
    previewUrl,
    previewSource
  } = song;

  const [showModal, setShowModal] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  console.log("🎧 Preview URL for track:", previewUrl);
  console.log("🔍 Preview Source:", previewSource);

  function handleAudioError() {
    console.warn(`🔇 No preview available from ${previewSource || "unknown"}`);
    setPreviewFailed(true);
  }

  return (
    <div className="song-card">
      <img src={albumCover} alt={`${album} cover`} className="song-card-img" />

      <div className="song-card-info">
        <h3 className="song-card-title">{name}</h3>
        <p className="song-card-artist">{artist}</p>
        <p className="song-card-album">{album}</p>

        <div className="song-card-links">
          {previewUrl && !previewFailed ? (
            <audio
              controls
              src={previewUrl}
              className="song-preview"
              onError={handleAudioError}
            />
          ) : (
            <p className="no-preview-msg">🔇 No preview available</p>
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
