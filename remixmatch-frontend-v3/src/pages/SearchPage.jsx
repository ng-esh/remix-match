/**
 * SearchPage Component
 * 
 * Lets users search for songs via the Spotify API.
 * Displays a list of results as SongCards.
 */

import React, { useState } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import SongCard from "../components/SongCard";
import AddToPlaylistModal from "../components/AddToPlaylistModal";
import "../styles/SearchPage.css";

function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  /** Handle form submission */
  async function handleSubmit(evt) {
    evt.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await RemixMatchApi.searchSpotify(query);
      setResults(res);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // This goes *outside* the return block:
  async function handleAddToPlaylist(trackId) {
    const playlistId = prompt("Enter the ID of the playlist to add this song to:");
    if (!playlistId) return;

    try {
      await RemixMatchApi.addSongToPlaylist(playlistId, trackId);
      alert("✅ Song added to playlist!");
    } catch (err) {
      alert("❌ Failed to add song.");
      console.error(err);
    }
  }

  function handleAddToPlaylist(trackId) {
    setSelectedTrack(trackId);
    setShowModal(true);
  }

  return (
    <div className="search-container">
      <h1 className="search-title">Search Songs</h1>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search for a song or artist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      {isLoading && <p className="search-loading">Searching...</p>}

      <div className="search-results">
      {results.map(song => (
          <SongCard
            key={song.id}
            song={song}
            showShare={true}
            onAddToPlaylist={handleAddToPlaylist}
          />
        ))}

      {showModal && selectedTrack && (
        <AddToPlaylistModal
          trackId={selectedTrack}
          onClose={() => setShowModal(false)}
        />
      )}

      </div>
    </div>
  );
}

export default SearchPage;
