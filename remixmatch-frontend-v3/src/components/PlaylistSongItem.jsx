/**
 * PlaylistSongItem Component
 * 
 * Displays one song inside a playlist.
 * If user owns the playlist, shows a Remove button.
 */

import React from "react";
import "../styles/PlaylistSongItem.css";

function PlaylistSongItem({ song, isOwner, onRemove }) {
  return (
    <li className="playlist-song-item">
      <div className="playlist-song-info">
        <p className="playlist-song-title">{song.song_title}</p>
        <p className="playlist-song-artist">{song.song_artist}</p>
      </div>

      {isOwner && (
        <button
          className="playlist-song-remove-btn"
          onClick={onRemove}
        >
          Remove
        </button>
      )}
    </li>
  );
}

export default PlaylistSongItem;
