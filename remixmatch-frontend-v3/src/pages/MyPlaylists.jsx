/**
 * MyPlaylists Page
 * 
 * Displays playlists created by the logged-in user and playlists shared with them.
 */

import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/MyPlaylists.css";
import PlaylistCard from "../components/PlaylistCard";

function MyPlaylists() {
  const { currentUser } = useContext(UserContext);
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const myPlaylists = await RemixMatchApi.getMyPlaylists();
        const sharedPlaylists = await RemixMatchApi.getPlaylistsSharedWithMe(currentUser.id);

        // Combine the two arrays
        setPlaylists([...myPlaylists, ...sharedPlaylists]);
      } catch (err) {
        console.error("Failed to load playlists:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlaylists();
  }, [currentUser]);

  if (isLoading) return <p>Loading your playlists...</p>;

  return (
    <div className="my-playlists-container">
      <h1 className="my-playlists-title">My Playlists</h1>

      {playlists.length === 0 ? (
        <p className="my-playlists-empty">You haven’t created, or shared any playlists yet.</p>
      ) : (
        <ul className="my-playlists-list">
            {playlists.map(playlist => (
                <li key={playlist.id} className="my-playlists-item">
                <PlaylistCard playlist={playlist} />  {/* <-- put a PlaylistCard inside */}
                </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default MyPlaylists;
