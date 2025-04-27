/**
 * LiveSessionCard Component
 * 
 * Displays information about a single public or private live listening session.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LiveSessionsCard.css";

function LiveSessionCard({ session }) {
  const { id, session_name, host_username, source_type, created_at, is_public } = session;
  const navigate = useNavigate();

  function handleJoin() {
    navigate(`/live/${id}`); // we'll wire this route later
  }

  return (
    <div className="live-session-card">
      <div className="live-session-info">
        <h3 className="live-session-title">
          {session_name}
          {!is_public && <span className="lock-icon">🔒</span>} {/* Private indicator */}
        </h3>
        <p className="live-session-host">Hosted by {host_username}</p>
        <p className="live-session-source">Source: {source_type}</p>
        <p className="live-session-time">
          Started at: {new Date(created_at).toLocaleString()}
        </p>
      </div>

      <button className="join-session-button" onClick={handleJoin}>
        Join
      </button>
    </div>
  );
}

export default LiveSessionCard;

// ✅ This cleanly displays:
// Session name
// Host username
// Source type (playlist, track, album)
// Start time (formatted to user’s local timezone)