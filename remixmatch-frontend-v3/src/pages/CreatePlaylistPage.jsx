/**
 * CreatePlaylistPage Component
 * 
 * Page wrapper for CreatePlaylistForm.
 */

import React from "react";
import CreatePlaylistForm from "../components/CreatePlaylistForm";

function CreatePlaylistPage() {
  return (
    <div className="create-playlist-page">
      <CreatePlaylistForm />
    </div>
  );
}

export default CreatePlaylistPage;
