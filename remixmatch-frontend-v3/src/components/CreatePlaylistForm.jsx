/**
 * CreatePlaylistForm Component
 * 
 * Form to create a new playlist.
 */

import React, { useState } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import { useNavigate } from "react-router-dom";
import "../styles/CreatePlaylistForm.css";

function CreatePlaylistForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    isPublic: false,
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
      const newPlaylist = await RemixMatchApi.createPlaylist(formData);
      navigate(`/playlists/${newPlaylist.id}`); // redirect to the new playlist's page
    } catch (err) {
      console.error("Failed to create playlist:", err);
      setFormError(["Failed to create playlist. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-playlist-form">
      <h2 className="create-playlist-title">Create a New Playlist</h2>

      {formError && (
        <div className="create-playlist-error">
          {formError.join(", ")}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="name">Playlist Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
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
        className="create-playlist-submit"
      >
        {isSubmitting ? "Creating..." : "Create Playlist"}
      </button>
    </form>
  );
}

export default CreatePlaylistForm;
