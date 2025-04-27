/**
 * AppRoutes
 * 
 * Defines the main application routes using React Router v6.
 */

import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import FeedPage from "./pages/FeedPage";
import SearchPage from "./pages/SearchPage";
import MyPlaylists from "./pages/MyPlaylists";
import PlaylistDetails from "./pages/PlaylistDetails";
import CreatePlaylistPage from "./pages/CreatePlaylistPage";
import LiveSessionsPage from "./pages/LiveSessionsPage";
import HostSessionPage from "./pages/HostSessionPage";
import JoinSessionPage from "./pages/JoinSessionPage";


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/playlists" element={<MyPlaylists />} />
      <Route path="/playlists/:id" element={<PlaylistDetails />} />
      <Route path="/playlists/new" element={<CreatePlaylistPage />} />
      <Route path="/live" element={<LiveSessionsPage />} />
      <Route path="/live/host" element={<HostSessionPage />} />
      <Route path="/live/:sessionId" element={<JoinSessionPage />} />

    </Routes>
  );
}

export default AppRoutes;
