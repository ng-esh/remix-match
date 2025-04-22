/**
 * LoginPage Component
 * 
 * Renders a login form and handles login logic.
 */

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import RemixMatchApi from "../api/RemixMatchApi";
import { UserContext } from "../context/UserContext";
import "../styles/LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const initialState = { username: "", password: "" };
  const [formData, setFormData] = useState(initialState);
  const [formError, setFormError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /** Handle input changes */
  function handleChange(evt) {
    const { name, value } = evt.target;
    setFormData(data => ({ ...data, [name]: value }));
  }

  /** Handle form submit */
  async function handleSubmit(evt) {
    evt.preventDefault();
    setIsLoading(true);
    setFormError(null);
    try {
      await login(formData); // 🔄 use context login function
      navigate("/feed");         // ✅ redirect on success (optional)
    } catch (err) {
      setFormError(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">Log In</h2>

        {formError && (
          <div className="login-error">
            {formError.join(", ")}
          </div>
        )}

        <div className="mb-4">
          <label className="login-label">Username</label>
          <input
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            className="login-input"
            required
          />
        </div>

        <div className="mb-6">
          <label className="login-label">Password</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="login-input"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="login-button"
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
