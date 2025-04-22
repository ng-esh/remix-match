/**
 * HomePage Component
 * 
 * Public landing page for ReMixMatch.
 * Introduces the app and encourages login/signup.
 */

import React from "react";
import { UserContext } from "../context/UserContext";

function HomePage() {
  const { currentUser } = useContext(UserContext);
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 text-white text-center px-6">
      <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
        Welcome to ReMixMatch 🎶
      </h1>
      {currentUser && (
        <p className="text-xl mb-4">Hello, {currentUser.username}!</p>
      )}
      <p className="text-lg max-w-xl mb-10">
        Discover new music, share songs with friends, and vibe together in real-time.
        Create playlists, join listening parties, and explore a world of sound.
      </p>
    </div>
  );
}

export default HomePage;
