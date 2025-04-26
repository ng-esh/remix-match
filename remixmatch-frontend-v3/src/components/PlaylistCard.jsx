import React from "react";
import { Link } from "react-router-dom";
import "../styles/PlaylistCard.css";

function PlaylistCard({ playlist }) {
  const { id, name, ownerUsername, isPublic } = playlist;

  return (
    <div className="playlist-card-wrapper">
      <Link to={`/playlists/${id}`} className="playlist-card">
        <div className="playlist-card-header">
          <h3 className="playlist-card-title">{name}</h3>
          <span className={`playlist-card-badge ${isPublic ? "public" : "private"}`}>
            {isPublic ? "Public" : "Private"}
          </span>
        </div>

        {ownerUsername && (
          <p className="playlist-card-owner">
            Created by {ownerUsername}
          </p>
        )}
      </Link>

      <div className="playlist-card-actions">
        <Link to={`/playlists/${id}`} className="playlist-card-action-button">
          View Playlist
        </Link>
      </div>
    </div>
  );
}

export default PlaylistCard;
