/**
 * SearchPage Component
 * 
 * Lets users search for songs via the Spotify API.
 * Displays a list of results as SongCards.
 */

import React, { useState } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import SongCard from "../components/SongCard";
import "../styles/SearchPage.css";

function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}

export default SearchPage;
