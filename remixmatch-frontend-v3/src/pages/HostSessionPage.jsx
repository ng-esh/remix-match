/**
 * HostSessionPage
 * 
 * Page for creating (hosting) a new live listening session.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RemixMatchApi from "../api/RemixMatchApi";
import "../styles/HostSessionPage.css";

function HostSessionPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sessionName: "",
    sourceType: "playlist", // default
    sourceId: "",
    isPublic: true, // default
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  function handleChange(evt) {
    const { name, value, type, checked } = evt.target;
    setFormData(data => ({
      ...data,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const session = await RemixMatchApi.createLiveSession(formData);
      navigate(`/live/${session.id}`);
    } catch (err) {
      console.error("Failed to create live session:", err);
      setFormError(["Failed to create live session. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="host-session-form">
      <h2 className="host-session-title">Host a Live Listening Session</h2>

      {formError && (
        <div className="host-session-error">
          {formError.map((e, idx) => (
            <div key={idx}>{e}</div>
          ))}
        </div>
      )}

      <div className="form-group">
        <label>Session Name</label>
        <input
          name="sessionName"
          type="text"
          value={formData.sessionName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Source Type</label>
        <select
          name="sourceType"
          value={formData.sourceType}
          onChange={handleChange}
          required
        >
          <option value="playlist">Playlist</option>
          <option value="track">Track</option>
          <option value="album">Album</option>
        </select>
      </div>

      <div className="form-group">
        <label>Source ID</label>
        <input
          name="sourceId"
          type="text"
          value={formData.sourceId}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group-checkbox">
        <label htmlFor="isPublic">Public?</label>
        <input
          id="isPublic"
          name="isPublic"
          type="checkbox"
          checked={formData.isPublic}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="host-session-submit"
      >
        {isSubmitting ? "Creating..." : "Create Session"}
      </button>
    </form>
  );
}

export default HostSessionPage;


// Purpose	                     Details
// Create a new live session	 Users can start a new public or private listening session
// Form fields needed	         Session Name, Source Type (playlist/track/album), Source ID, Public or Private toggle
// Submit button	             Sends form data to backend (POST /live/create)
// After success	             Redirects the user to the newly created session page /live/:sessionId

// 🛠️ How the Flow Will Work:
// Step	    Action
// 1	    User visits /live/host
// 2	    Fills out form: Name, Source Type, Source ID, Public/Private
// 3	    Clicks "Create Session"
// 4	    Backend creates session, returns session info
// 5	    Frontend redirects user to /live/:newSessionId ✅