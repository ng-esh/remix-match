/**
 * HomePage Component
 * 
 * Public landing page for ReMixMatch.
 * Introduces the app and encourages login/signup.
 */

import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import Lottie from "lottie-react";
import musicAnimation from "../assets/musicAnimation.json";
import "../styles/HomePage.css";

function HomePage() {
  const { currentUser } = useContext(UserContext);

  return (
    <div className="home-container">
      <h1 className="home-title">
        Welcome to ReMixMatch 🎶
      </h1>

      <div className="home-animation">
      <div className="home-lottie-wrapper">
        <Lottie animationData={musicAnimation} loop={true} className="home-lottie" />
      </div>
    </div>

      {currentUser ? (
        <p className="home-greeting">Hello, {currentUser.username}!</p>
      ) : (
        <div className="home-cta-buttons">
          <Link to="/login" className="home-button login-button">
            Log In
          </Link>
          <Link to="/signup" className="home-button signup-button">
            Sign Up
          </Link>
        </div>
      )}

      <p className="home-description">
        Discover new music, share songs with friends, and vibe together in real-time.
        Create playlists, join listening parties, and explore a world of sound.
      </p>
    </div>
  );
}

export default HomePage;
