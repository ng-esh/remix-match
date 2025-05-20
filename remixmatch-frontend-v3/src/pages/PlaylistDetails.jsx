import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import RemixMatchApi from "../api/RemixMatchApi";
import SharePlaylistForm from "../components/SharePlaylistForm";
import PlaylistSongItem from "../components/PlaylistSongItem";
import SortableSongItem from "../components/SortableSongItem";
import VoteButton from "../components/VoteButton";
import "../styles/PlaylistDetails.css";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    async function fetchPlaylist() {
      try {
        const playlistRes = await RemixMatchApi.getPlaylistById(id);
        const songsRes = await RemixMatchApi.getSongsInPlaylist(id);

        const enrichedSongs = await Promise.all(
          songsRes.map(async (song) => {
            try {
              const details = await RemixMatchApi.getSongById(song.track_id);
              return {
                ...song,
                song_title: details.name,
                song_artist: details.artist,
                album: details.album,
                albumCover: details.album_cover,
                spotifyUrl: details.spotify_url,
                previewUrl: details.preview_url,
                previewSource: details.preview_source
              };
            } catch (err) {
              console.error(`Failed to enrich metadata for ${song.track_id}`);
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

  async function handleToggleVisibility() {
    try {
      const updated = await RemixMatchApi.updatePlaylistVisibility(playlist.id, !playlist.isPublic);
      setPlaylist(updated);
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
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

  async function handleSongSearch(evt) {
    evt.preventDefault();
    try {
      const res = await RemixMatchApi.searchSpotify(searchQuery);
      setSearchResults(res);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  async function handleAddSong(trackId) {
    try {
      await RemixMatchApi.addSongToPlaylist(id, trackId);
      setSearchResults([]);
      setSearchQuery("");

      const refreshed = await RemixMatchApi.getSongsInPlaylist(id);
      const enriched = await Promise.all(
        refreshed.map(async (s) => {
          try {
            const d = await RemixMatchApi.getSongById(s.track_id);
            return {
              ...s,
              song_title: d.name,
              song_artist: d.artist,
              album: d.album,
              albumCover: d.album_cover,
              spotifyUrl: d.spotify_url,
              previewUrl: d.preview_url,
              previewSource: d.preview_source
            };
          } catch {
            return s;
          }
        })
      );
      setSongs(enriched);
    } catch (err) {
      console.error("Failed to add song:", err);
    }
  }

  const isOwner = currentUser && currentUser.id === playlist?.userId;

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
            <button onClick={handleToggleVisibility} className="visibility-toggle-btn">
              {playlist.isPublic ? "🔒 Make Private" : "🌍 Make Public"}
            </button>
            <button onClick={() => setShowSearch(!showSearch)} className="add-songs-btn">
              {showSearch ? "Hide Search" : "➕ Add Songs"}
            </button>
          </div>
        )}

        {showSearch && (
          <div className="playlist-song-search">
            <input
              type="text"
              placeholder="Search for a song..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button onClick={handleSongSearch}>Search</button>
            <div className="search-results-sidebar">
              {searchResults.map(song => (
                <div className="search-result-item" key={song.id}>
                  <span>{song.name} - {song.artist}</span>
                  <button onClick={() => handleAddSong(song.id)}>Add</button>
                </div>
              ))}
            </div>
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={songs.map(s => s.track_id)}
                strategy={verticalListSortingStrategy}
              >
                {songs.map(song => (
                  <SortableSongItem key={song.track_id} song={song} />
                ))}
              </SortableContext>
            </DndContext>
            <button onClick={handleSaveReorder} className="save-order-btn">Save New Order</button>
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
