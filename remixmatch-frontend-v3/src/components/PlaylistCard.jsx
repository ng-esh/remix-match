/**
 * PlaylistCard Component
 * 
 * Displays basic info about a playlist.
 */

import React from "react";
import "../styles/PlaylistCard.css";

function PlaylistCard({ playlist }) {
  const { id, name, ownerUsername, isPublic } = playlist;

  return (
    <div className="playlist-card">
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

      <div className="playlist-card-actions">
        <a href={`/playlists/${id}`} className="playlist-card-link">
          View Playlist
        </a>
      </div>
    </div>
  );
}

export default PlaylistCard;
