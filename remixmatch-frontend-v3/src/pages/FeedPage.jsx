import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/FeedPage.css";

function FeedPage() {
  const { currentUser } = useContext(UserContext);
  const [sharedSongs, setSharedSongs] = useState([]);
  const [upvotedPlaylists, setUpvotedPlaylists] = useState([]);
  const [hiddenSongIds, setHiddenSongIds] = useState([]);
  const [showMessages, setShowMessages] = useState(true);
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem("remixmatch-dark-mode") === "true"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeed() {
      try {
        if (currentUser) {
          const rawShares = await RemixMatchApi.getSentSongShares(currentUser.id);
          const upvotedPlaylistsRes = await RemixMatchApi.getUserVotes(currentUser.id);

          const enrichedShares = await Promise.all(
            rawShares.map(async (share) => {
              try {
                const songDetails = await RemixMatchApi.getSpotifyTrackById(share.track_id);
                return {
                  ...share,
                  song_title: songDetails.name,
                  song_artist: songDetails.artist,
                  album: songDetails.album,
                  albumCover: songDetails.albumCover
                };
              } catch (err) {
                console.error("Failed to fetch song details for:", share.track_id);
                return share;
              }
           })
          );

          setSharedSongs(enrichedShares);
          setUpvotedPlaylists(
            upvotedPlaylistsRes.filter(v => v.vote_type === "upvote")
          );
        }
      } catch (err) {
        console.error("Failed to load feed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeed();
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("remixmatch-dark-mode", darkMode);
  }, [darkMode]);

  function handleHideSong(songId) {
    setHiddenSongIds((prev) => [...prev, songId]);
  }

  const visibleSongs = sharedSongs.filter(song => !hiddenSongIds.includes(song.id));

  if (isLoading) return <p className="loading-text">Loading your feed...</p>;

  return (
    <div className={`feed-container ${darkMode ? "dark-mode" : ""}`}>
      <aside className="feed-sidebar">
       <div>
        <Link to="/feed" className="sidebar-header"> Your Library</Link>
        </div>
        <ul className="sidebar-list">
          <li>
          <Link to="/playlists" className="sidebar-link">Playlists</Link>
          </li>
          <li>Live sessions</li>
         
        </ul>
      </aside>
  
      <main className="feed-main">
        <header className="feed-header">
          <h1>Welcome back, {currentUser?.username}</h1>
          <div className="toggle-group">
            <label>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              Dark Mode
            </label>
            <label>
              <input
                type="checkbox"
                checked={showMessages}
                onChange={() => setShowMessages(!showMessages)}
              />
              Show messages
            </label>
          </div>
        </header>
  
        <section className="feed-section">
          <h2>Songs I'd Recommend</h2>
          {visibleSongs.length === 0 ? (
            <p className="feed-subtext">You haven’t shared any songs yet.</p>
          ) : (
            <ul className="feed-list">
              {visibleSongs.map(song => (
                <li key={song.id} className="feed-card">
                  <img
                    src={song.albumCover}
                    alt={`${song.album || "Unknown Album"} cover`}
                    className="feed-album-cover"
                  />
                  <div className="feed-card-info">
                    <p className="feed-song-title">{song.song_title}</p>
                    <p className="feed-song-artist">by {song.song_artist}</p>
                    <p className="feed-song-album">{song.album}</p>
                    {showMessages && song.message && (
                      <p className="feed-song-message">💬 {song.message}</p>
                    )}
                    <button
                      className="hide-btn"
                      onClick={() => handleHideSong(song.id)}
                    >
                      Remove from feed
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
  
        <section className="feed-section">
          <h2>Playlists I’ve Upvoted</h2>
          {upvotedPlaylists.length === 0 ? (
            <p className="feed-subtext">You haven’t upvoted any playlists yet.</p>
          ) : (
            <ul className="feed-list">
              {upvotedPlaylists.map(playlist => (
                <li key={playlist.playlist_id} className="feed-card">
                  <p className="feed-playlist-name">{playlist.playlist_name}</p>
                  <p className="feed-playlist-owner">Shared by: {playlist.owner_username}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
 }

export default FeedPage;
