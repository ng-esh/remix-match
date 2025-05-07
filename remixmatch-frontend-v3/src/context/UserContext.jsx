import React, { useState, useEffect, createContext } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import { jwtDecode } from "jwt-decode";

/** UserContext
 *
 * Provides global login state across the app.
 * Stores currentUser and token.
 * Offers login(), signup(), and logout() helpers.
 */

const UserContext = createContext();

function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("remixmatch-token"));
  const [isLoading, setIsLoading] = useState(true);

  /** Set token and fetch user */
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const { username } = jwtDecode(token);
          RemixMatchApi.setToken(token);
          const user = await RemixMatchApi.getCurrentUser(username);
          setCurrentUser(user);
        } catch (err) {
          console.error("UserContext loadUser failed:", err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  /** Handle login from LoginPage */
  async function login(loginData) {
    const newToken = await RemixMatchApi.login(loginData);
    RemixMatchApi.setToken(newToken); // ✅ Immediately usable for next API call
    localStorage.setItem("remixmatch-token", newToken);
    setToken(newToken);
  }
  
  
  /** Handle signup from SignupPage */
  async function signup(signupData) {
    const newToken = await RemixMatchApi.signup(signupData);
    RemixMatchApi.setToken(newToken);
    localStorage.setItem("remixmatch-token", newToken);
    setToken(newToken);
  }
  /** Handle logout */
  function logout() {
    localStorage.removeItem("remixmatch-token");
    setToken(null);
    setCurrentUser(null);
    RemixMatchApi.setToken(null);
  }
  

  const value = { currentUser, login, signup, logout };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext, UserProvider };
