import React, { useState } from "react";
import ShareFormModal from "./ShareFormModal";
import "../styles/SongCard.css";

function SongCard({ song }) {
  const { name, artist, album, albumCover, spotifyUrl, previewUrl, id } = song;

  const [showModal, setShowModal] = useState(false);

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
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="spotify-link"
          >
            Open in Spotify
          </a>

          <button className="share-btn" onClick={() => setShowModal(true)}>
            Share
          </button>
        </div>
      </div>

      {showModal && (
        <ShareFormModal songId={id} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default SongCard;
