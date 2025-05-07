import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/FeedPage.css";

function FeedPage() {
  const { currentUser } = useContext(UserContext);
  const [sharedSongs, setSharedSongs] = useState([]);
  const [upvotedPlaylists, setUpvotedPlaylists] = useState([]);
  const [showMessages, setShowMessages] = useState(true);
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

  if (isLoading) return <p className="loading-text">Loading your feed...</p>;

  return (
    <div className="feed-container">
      <h1 className="feed-header">
        {currentUser ? `Welcome back, ${currentUser.username}` : "Your Music Feed"}
      </h1>

      <div className="feed-section">
        <h2 className="feed-section-title">Songs I'd Recommend:</h2>

        <div className="feed-toggle">
          <label>
            <input
              type="checkbox"
              checked={showMessages}
              onChange={() => setShowMessages(!showMessages)}
            />
            Show personal messages
          </label>
        </div>

        {sharedSongs.length === 0 ? (
          <p className="feed-subtext">You haven’t shared any songs yet.</p>
        ) : (
          <ul className="feed-list">
            {sharedSongs.map(song => (
              <li key={song.id} className="feed-card">
                <img
                  src={song.albumCover}
                  alt={`${song.album} cover`}
                  className="feed-album-cover"
                />
                <div className="feed-card-info">
                  <p className="feed-song-title">{song.song_title}</p>
                  <p className="feed-song-artist">by {song.song_artist}</p>
                  <p className="feed-song-album">{song.album}</p>
                  {showMessages && song.message && (
                    <p className="feed-song-message">💬 {song.message}</p>
                  )}
                </div>
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
