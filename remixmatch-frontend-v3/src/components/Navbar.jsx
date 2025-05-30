import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

/**
 * Navbar component
 * 
 * Displays site navigation based on user authentication state.
 */
function Navbar() {
  const { currentUser, logout } = useContext(UserContext);
  const navigate = useNavigate();

  /** Handle logout and redirect to homepage */
  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold hover:underline">ReMixMatch</Link>

      <div className="space-x-4 flex items-center">
        {currentUser ? (
          <>
            {/* Greeting that links to /feed */}
            <Link
              to="/feed"
              className="text-sm hover:underline"
            >
              Hi, {currentUser.username}
            </Link>

            <Link to="/playlists" className="hover:underline">Playlists</Link>
            <Link to="/live" className="hover:underline">Sessions</Link>
            <Link to="/search" className="hover:underline">Search</Link>

            <button
              onClick={handleLogout}
              className="bg-white text-indigo-700 px-3 py-1 rounded hover:bg-gray-200 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/signup" className="hover:underline">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
