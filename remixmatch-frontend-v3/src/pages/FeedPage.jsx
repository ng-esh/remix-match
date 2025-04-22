/**
 * FeedPage Component
 *
 * Displays a personalized music feed for the logged-in user.
 * Shows songs the user has shared (as recommendations) and playlists they’ve upvoted.
 */

import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/FeedPage.css";

function FeedPage() {
  const { currentUser } = useContext(UserContext);
  const [sharedSongs, setSharedSongs] = useState([]);
  const [upvotedPlaylists, setUpvotedPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeed() {
      try {
        if (currentUser) {
          const sharedSongsRes = await RemixMatchApi.getSentSongShares(currentUser.id);
          const upvotedPlaylistsRes = await RemixMatchApi.getUserVotes(currentUser.id);

          setSharedSongs(sharedSongsRes);
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

  if (isLoading) return <p>Loading your feed...</p>;

  return (
    <div className="feed-container">
      <h1 className="feed-header">
        {currentUser ? `Welcome back, ${currentUser.username}` : "Your Music Feed"}
      </h1>

      <div className="feed-section">
        <h2 className="feed-section-title">Songs I'd Recommend:</h2>
        {sharedSongs.length === 0 ? (
          <p className="feed-subtext">You haven’t shared any songs yet.</p>
        ) : (
          <ul className="feed-list">
            {sharedSongs.map(song => (
              <li key={song.id} className="feed-card">
                <p className="feed-song-title">{song.song_title}</p>
                <p className="feed-song-artist">{song.song_artist}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="feed-section">
        <h2 className="feed-section-title">Playlists I’ve Upvoted:</h2>
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
      </div>
    </div>
  );
}

export default FeedPage;
