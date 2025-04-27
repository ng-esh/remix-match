/**
 * JoinSessionPage
 * 
 * Displays details of a specific live listening session.
 * 
 * If session not found, shows a styled error card and auto-redirects to /live after 5 seconds.
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/JoinSessionPage.css";

function JoinSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await RemixMatchApi.getSessionById(sessionId);
        setSession(res);
      } catch (err) {
        console.error("Failed to load session:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  // Auto-redirect back to /live after 5 seconds if session not found
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        navigate("/live");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  if (isLoading) return <p>Loading session...</p>;

  if (error || !session) {
    return (
      <div className="join-session-error">
        <h2 className="error-title">Session Not Found</h2>
        <p className="error-message">The session you’re looking for doesn’t exist or has ended.</p>
        <a href="/live" className="error-back-link">← Back to Live Sessions</a>
      </div>
    );
  }

  return (
    <div className="join-session-container">
      <h1 className="join-session-title">{session.session_name}</h1>
      <p className="join-session-host">Hosted by {session.host_username}</p>
      <p className="join-session-source">Source: {session.source_type}</p>
      <p className="join-session-started">
        Started at: {new Date(session.created_at).toLocaleString()}
      </p>

      {session.is_public ? (
        <p className="join-session-public">This is a public session.</p>
      ) : (
        <p className="join-session-private">This is a private session. Invite required.</p>
      )}
    </div>
  );
}

export default JoinSessionPage;
