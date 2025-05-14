/**
 * PlaylistSongItem Component
 * 
 * Displays one song inside a playlist.
 * Includes:
 * - Album cover
 * - Song title and artist
 * - Spotify link
 * - Audio preview (if available)
 * - Remove button if user owns the playlist
 */

import React from "react";
import "../styles/PlaylistSongItem.css";

function PlaylistSongItem({ song, isOwner, onRemove }) {
  const {
    song_title,
    song_artist,
    album,
    albumCover,
    spotifyUrl,
    previewUrl
  } = song;

  console.log("🎧 Preview URL for track:", previewUrl);

  return (
    <li className="playlist-song-item-card">
      <img
        src={albumCover}
        alt={`${album} cover`}
        className="playlist-song-img"
      />

      <div className="playlist-song-meta">
        <p className="playlist-song-title">{song_title}</p>
        <p className="playlist-song-artist">{song_artist}</p>
        <p className="playlist-song-album">{album}</p>

        <div className="playlist-song-links">
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

          {previewUrl && (
            <audio controls className="song-preview-player" src={previewUrl} />
          )}
        </div>
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
