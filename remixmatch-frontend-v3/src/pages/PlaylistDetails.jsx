
/**
 * PlaylistDetails Page
 * 
 * Displays a playlist's songs.
 * If user owns the playlist, allows them to remove songs, rename the playlist,
 * delete the playlist, share it, and reorder songs using drag-and-drop.
 */

import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/PlaylistDetails.css";
import SharePlaylistForm from "../components/SharePlaylistForm";
import PlaylistSongItem from "../components/PlaylistSongItem";
import SortableSongItem from "../components/SortableSongItem";
import VoteButton from "../components/VoteButton";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

function PlaylistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareForm, setShowShareForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    async function fetchPlaylist() {
      try {
        const playlistRes = await RemixMatchApi.getPlaylistById(id);
        const songsRes = await RemixMatchApi.getSongsInPlaylist(id);

        const enrichedSongs = await Promise.all(
          songsRes.map(async (song) => {
            try {
              const details = await RemixMatchApi.getSpotifyTrackById(song.track_id);
              return {
                ...song,
                song_title: details.name,
                song_artist: details.artist,
                album: details.album,
                albumCover: details.albumCover,
                spotifyUrl: details.spotifyUrl,
                previewUrl: details.previewUrl,
              };
            } catch (err) {
              console.error(`Failed to fetch metadata for ${song.track_id}`);
              return song;
            }
          })
        );

        setPlaylist(playlistRes);
        setNewName(playlistRes.name);
        setSongs(enrichedSongs);
      } catch (err) {
        console.error("Failed to load playlist:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlaylist();
  }, [id]);

  async function handleRename(evt) {
    evt.preventDefault();
    setIsUpdating(true);
    try {
      const updated = await RemixMatchApi.updatePlaylistName(playlist.id, newName);
      setPlaylist(updated);
      setShowEditForm(false);
    } catch (err) {
      console.error("Failed to update playlist name:", err);
      alert("Could not update playlist name.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRemoveSong(trackId) {
    const confirmDelete = window.confirm("Are you sure you want to remove this song?");
    if (!confirmDelete) return;
    try {
      await RemixMatchApi.removeSongFromPlaylist(id, trackId);
      setSongs(songs => songs.filter(s => s.track_id !== trackId));
    } catch (err) {
      console.error("Failed to remove song:", err);
    }
  }

  async function handleDeletePlaylist() {
    const confirmDelete = window.confirm("Are you sure you want to delete this playlist?");
    if (!confirmDelete) return;
    try {
      await RemixMatchApi.deletePlaylist(id);
      navigate("/playlists");
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    }
  }

  async function handleSaveReorder() {
    const orderedTrackIds = songs.map(s => s.track_id);
    try {
      await RemixMatchApi.reorderPlaylistSongs(playlist.id, orderedTrackIds);
      alert("Playlist order updated!");
      setIsReordering(false);
    } catch (err) {
      console.error("Failed to reorder songs:", err);
      alert("Error saving new order.");
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = songs.findIndex(s => s.track_id === active.id);
      const newIndex = songs.findIndex(s => s.track_id === over.id);
      setSongs(arrayMove(songs, oldIndex, newIndex));
    }
  }

  if (isLoading) return <p>Loading playlist...</p>;
  if (!playlist) {
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

  const isOwner = currentUser && currentUser.id === playlist.userId;

  return (
    
      <div className="playlist-details-layout">
        <aside className="playlist-sidebar">
          <h1 className="playlist-details-title">{playlist.name}</h1>
    
          <button onClick={() => setShowShareForm(!showShareForm)} className="share-btn">
            {showShareForm ? "Close Share Form" : "Share Playlist"}
          </button>
    
          {isOwner && (
            <div className="playlist-details-actions">
              <button className="playlist-delete-btn" onClick={handleDeletePlaylist}>Delete Playlist</button>
              <button onClick={() => setShowEditForm(!showEditForm)} className="edit-name-btn">
                {showEditForm ? "Cancel Edit" : "Edit Name"}
              </button>
    
              {showEditForm && (
                <form onSubmit={handleRename} className="edit-name-form">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Updating..." : "Save"}
                  </button>
                </form>
              )}
    
              <button onClick={() => setIsReordering(!isReordering)} className="reorder-toggle-btn">
                {isReordering ? "Cancel Reorder" : "Reorder Songs"}
              </button>
            </div>
          )}
        </aside>
    
        <section className="playlist-main">
          {showShareForm && (
            <SharePlaylistForm playlistId={playlist.id} onClose={() => setShowShareForm(false)} />
          )}
    
          {songs.length === 0 ? (
            <p className="playlist-details-empty">This playlist is currently empty.</p>
          ) : (
            !isReordering && (
              <ul className="playlist-songs-list">
                {songs.map(song => (
                  <PlaylistSongItem
                    key={song.track_id}
                    song={song}
                    isOwner={isOwner}
                    onRemove={() => handleRemoveSong(song.track_id)}
                  />
                ))}
              </ul>
            )
          )}
    
          {isReordering && (
            <>
              <DndContext
                sensors={useSensors(useSensor(PointerSensor))}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={songs.map(s => s.track_id)}
                  strategy={verticalListSortingStrategy}
                >
                  {songs.map(song => (
                    <SortableSongItem key={song.track_id} song={song} />
                  ))}
                </SortableContext>
              </DndContext>
    
              <button onClick={handleSaveReorder} className="save-order-btn">
                Save New Order
              </button>
            </>
          )}
    
          {playlist.isPublic && (
            <div className="playlist-vote-block">
              <VoteButton playlistId={playlist.id} />
            </div>
          )}
        </section>
      </div>
    );
     
}

export default PlaylistDetails;
