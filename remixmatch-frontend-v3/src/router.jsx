/**
 * AppRoutes
 * 
 * Defines the main application routes using React Router v6.
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import PrivateRoute from "./components/PrivateRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Private Routes */}
      <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
      <Route path="/playlists" element={<PrivateRoute><MyPlaylists /></PrivateRoute>} />
      <Route path="/playlists/:id" element={<PrivateRoute><PlaylistDetails /></PrivateRoute>} />
      <Route path="/playlists/new" element={<PrivateRoute><CreatePlaylistPage /></PrivateRoute>} />
      <Route path="/live" element={<PrivateRoute><LiveSessionsPage /></PrivateRoute>} />
      <Route path="/live/host" element={<PrivateRoute><HostSessionPage /></PrivateRoute>} />
      <Route path="/live/:sessionId" element={<PrivateRoute><JoinSessionPage /></PrivateRoute>} />

      {/* Catch-all: redirect unknown routes */}
      <Route path="*" element={<Navigate to="/feed" />} />
    </Routes>
  );
}

export default AppRoutes;
