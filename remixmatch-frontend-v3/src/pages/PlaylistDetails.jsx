/**
 * PlaylistDetails Page
 * 
 * Displays a playlist's songs.
 * If user owns the playlist, allows them to remove songs or delete the playlist.
 */

import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/PlaylistDetails.css";

function PlaylistDetails() {
  const { id } = useParams(); // playlist ID from URL
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaylist() {
      try {
        const playlistRes = await RemixMatchApi.getPlaylistById(id);
        const songsRes = await RemixMatchApi.getSongsInPlaylist(id);
        setPlaylist(playlistRes);
        setSongs(songsRes);
      } catch (err) {
        console.error("Failed to load playlist:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlaylist();
  }, [id]);

  async function handleRemoveSong(songId) {
    const confirmDelete = window.confirm("Are you sure you want to remove this song from the playlist?");
    if (!confirmDelete) return;

    try {
      await RemixMatchApi.removeSongFromPlaylist(id, songId);
      setSongs(songs => songs.filter(song => song.id !== songId));
    } catch (err) {
      console.error("Failed to remove song:", err);
    }
  }

  async function handleDeletePlaylist() {
    const confirmDelete = window.confirm("Are you sure you want to delete this entire playlist?");
    if (!confirmDelete) return;

    try {
      await RemixMatchApi.deletePlaylist(id);
      navigate("/playlists"); // redirect after deletion
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    }
  }

  if (isLoading) return <p>Loading playlist...</p>;
  if (!playlist){
    return (
        <div className="playlist-details-empty-state">
        <h2 className="playlist-details-empty-title">Playlist not found</h2>
        <p className="playlist-details-empty-message">
          The playlist you're looking for doesn't exist or has been deleted.
        </p>
        <a href="/playlists" className="playlist-details-back-button">
          Back to My Playlists
        </a>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.id === playlist.ownerId;

  return (
    <div className="playlist-details-container">
      <h1 className="playlist-details-title">{playlist.name}</h1>

      {isOwner && (
        <div className="playlist-details-actions">
          <button
            className="playlist-delete-btn"
            onClick={handleDeletePlaylist}
          >
            Delete Playlist
          </button>
        </div>
      )}

      {songs.length === 0 ? (
        <p className="playlist-details-empty">This playlist is currently empty.</p>
      ) : (
        <ul className="playlist-songs-list">
          {songs.map(song => (
            <PlaylistSongItem
              key={song.id}
              song={song}
              isOwner={isOwner}
              onRemove={() => handleRemoveSong(song.id)}
            />
          ))}
        </ul>

      )}
    </div>
  );
}

export default PlaylistDetails;
