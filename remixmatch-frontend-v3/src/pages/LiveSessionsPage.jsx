
/**
 * LiveSessionsPage
 * 
 * Displays a list of all public live listening sessions.
 * Now includes a sidebar with links to host or join a session.
 */

/**
 * LiveSessionsPage
 * 
 * Displays all public live sessions AND all sessions hosted by the current user.
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RemixMatchApi from "../api/RemixMatchApi";
import LiveSessionCard from "../components/LiveSessionCard";
import "../styles/LiveSessionsPage.css";

function LiveSessionsPage() {
  const [publicSessions, setPublicSessions] = useState([]);
  const [hostedSessions, setHostedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinId, setJoinId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSessions() {
      try {
        const publicRes = await RemixMatchApi.getPublicSessions();
        const hostedRes = await RemixMatchApi.getHostedSessions();
        setPublicSessions(publicRes);
        setHostedSessions(hostedRes);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessions();
  }, []);

  function handleJoinSession(evt) {
    evt.preventDefault();
    if (joinId.trim() !== "") {
      navigate(`/live/${joinId}`);
    }
  }

  return (
    <div className="flex flex-col md:flex-row">
      {/* Mobile toggle button */}
      <button
        className="md:hidden bg-indigo-600 text-white px-4 py-2 m-2 rounded"
        onClick={() => setSidebarOpen(prev => !prev)}
      >
        {sidebarOpen ? "Hide Options" : "Show Options"}
      </button>

      {/* Sidebar */}
      <aside
        className={`w-full md:w-64 bg-indigo-100 p-4 border-r border-indigo-200 
                    ${sidebarOpen ? "block" : "hidden"} md:block`}
      >
        <h2 className="text-lg font-semibold mb-4">Live Sessions</h2>
        <ul className="space-y-2">
          <li>
            <Link to="/live/host" className="text-indigo-700 hover:underline">
              ➕ Host New Session
            </Link>
          </li>
          <li>
            <form onSubmit={handleJoinSession} className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Join by Session ID:
              </label>
              <input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="e.g. 123"
                className="w-full px-2 py-1 border border-gray-300 rounded"
              />
              <button
                type="submit"
                className="mt-2 w-full bg-indigo-600 text-white py-1 rounded hover:bg-indigo-700 transition"
              >
                Join
              </button>
            </form>
          </li>
        </ul>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Live Listening Sessions</h1>

        {isLoading ? (
          <p>Loading sessions...</p>
        ) : (
          <>
            {/* Hosted sessions */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">👤 My Hosted Sessions</h2>
              {hostedSessions.length === 0 ? (
                <p className="live-sessions-empty">You haven’t hosted any sessions yet.</p>
              ) : (
                <div className="live-sessions-list grid gap-4">
                  {hostedSessions.map((session) => (
                    <LiveSessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </section>

            {/* Public sessions */}
            <section>
              <h2 className="text-xl font-semibold mb-2">🌐 Public Sessions</h2>
              {publicSessions.length === 0 ? (
                <p className="live-sessions-empty">No live public sessions right now.</p>
              ) : (
                <div className="live-sessions-list grid gap-4">
                  {publicSessions.map((session) => (
                    <LiveSessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
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