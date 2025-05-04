/**
 * VoteButton Component
 * 
 * Shows upvote/downvote buttons for a playlist.
 * Highlights user's current vote and displays totals.
 * 
 * This component handles:
 - Upvote/downvote buttons
 - Fetching and displaying current totals
 - Highlighting what the user already voted
 - Allowing toggle and removal
 */
 import React, { useEffect, useState, useContext } from "react";
 import { UserContext } from "../context/UserContext";
 import RemixMatchApi from "../api/RemixMatchApi";
 import "../styles/VoteButton.css";
 
 /**
  * VoteButton
  *
  * Handles upvote/downvote logic and UI for a playlist.
  */
 function VoteButton({ playlistId }) {
   const { currentUser } = useContext(UserContext);
   const [userVote, setUserVote] = useState(null); // 1, -1, or null
   const [voteTotals, setVoteTotals] = useState({ upvotes: 0, downvotes: 0 });
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     async function fetchVotes() {
       try {
         const totals = await RemixMatchApi.getPlaylistVotes(playlistId);
         setVoteTotals(totals);
 
         const userVotes = await RemixMatchApi.getUserVotes();
         const match = userVotes.find(v => v.playlist_id === playlistId);
         setUserVote(match?.vote_type || null);
       } catch (err) {
         console.error("Failed to load vote data:", err);
       } finally {
         setLoading(false);
       }
     }
 
     if (currentUser) fetchVotes();
   }, [playlistId, currentUser]);
 
   async function handleVote(type) {
     try {
       if (userVote === type) {
         await RemixMatchApi.removeVote(playlistId);
         setUserVote(null);
       } else {
         await RemixMatchApi.castVote(playlistId, type);
         setUserVote(type);
       }
 
       const updated = await RemixMatchApi.getPlaylistVotes(playlistId);
       setVoteTotals(updated);
     } catch (err) {
       console.error("Vote error:", err);
     }
   }
 
   if (!currentUser || loading) return null;
 
   return (
     <div className="vote-icon-wrapper">
       <div
         className={`vote-icon ${userVote === 1 ? "active" : ""}`}
         onClick={() => handleVote(1)}
       >
         👍 <span className="vote-count">{voteTotals.upvotes}</span>
       </div>
       <div
         className={`vote-icon ${userVote === -1 ? "active" : ""}`}
         onClick={() => handleVote(-1)}
       >
         👎 <span className="vote-count">{voteTotals.downvotes}</span>
       </div>
     </div>
   );
 }
 
 export default VoteButton;
 