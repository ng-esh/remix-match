import React, { useState, useEffect, createContext } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import jwt_decode from "jwt-decode";

/** UserContext
 *
 * Provides global login state across the app.
 * Stores currentUser and token.
 * Offers login() and logout() helpers.
 */

const UserContext = createContext();

function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Set token and fetch user */
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const { username } = jwt_decode(token);
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
    setToken(newToken);
  }

  /** Handle logout */
  function logout() {
    setToken(null);
    setCurrentUser(null);
    RemixMatchApi.setToken(null);
  }

  const value = { currentUser, login, logout };

  if (isLoading) return <p>Loading...</p>;

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext, UserProvider };
