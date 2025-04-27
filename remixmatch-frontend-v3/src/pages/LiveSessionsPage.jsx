/**
 * LiveSessionsPage
 * 
 * Displays a list of all public live listening sessions.
 */

import React, { useEffect, useState } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/LiveSessionsPage.css";
import LiveSessionCard from "../components/LiveSessionCard"; // we'll build this next

function LiveSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await RemixMatchApi.getPublicSessions();
        setSessions(res);
      } catch (err) {
        console.error("Failed to load live sessions:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessions();
  }, []);

  if (isLoading) return <p>Loading live sessions...</p>;

  return (
    <div className="live-sessions-container">
      <h1 className="live-sessions-title">Live Listening Sessions</h1>

      {sessions.length === 0 ? (
        <p className="live-sessions-empty">No live sessions happening right now.</p>
      ) : (
        <div className="live-sessions-list">
          {sessions.map(session => (
            <LiveSessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveSessionsPage;

// 🎯 Final Behavior:

// Page: /live
// What happens
// Shows "Live Listening Sessions" title
// Shows "Loading..." spinner at first
// If no sessions: shows "No live sessions happening right now"
// If sessions exist: displays them using LiveSessionCard