/**
 * SignupPage Component
 * 
 * Renders a signup form for new users.
 * Handles:
 * - Live validation for password length
 * - Backend error handling and display
 * - Success message on successful signup
 */

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "../styles/SignupPage.css";

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useContext(UserContext);

  const initialState = {
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    password: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [formError, setFormError] = useState([]);
  const [formSuccess, setFormSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /** Handle input changes and live password validation */
  function handleChange(evt) {
    const { name, value } = evt.target;
    setFormData(data => ({ ...data, [name]: value }));

    // Live password validation only
    if (name === "password") {
      if (value.length > 0 && value.length < 6) {
        setFormError(["Password must be at least 6 characters."]);
      } else {
        setFormError([]);
      }
    }
  }

  /** Handle signup form submit */
  async function handleSubmit(evt) {
    evt.preventDefault();
    setIsLoading(true);
    setFormError([]);
    setFormSuccess(null);

    try {
      // Double-check on submit
      if (!formData.email || !formData.username || !formData.firstName || !formData.lastName || !formData.password) {
        setFormError(["All fields are required."]);
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setFormError(["Password must be at least 6 characters."]);
        setIsLoading(false);
        return;
      }

      await signup(formData);
      setFormSuccess("Signed up successfully! Redirecting...");
      setTimeout(() => navigate("/feed"), 1500);

    } catch (err) {
      // Properly unwrap backend errors
      if (Array.isArray(err)) {
        setFormError(err);
      } else if (err?.response?.data?.error) {
        setFormError([err.response.data.error]);
      } else {
        setFormError(["An unknown error occurred."]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-form">
        <h2 className="signup-title">Sign Up</h2>

        {formError.length > 0 && (
          <div className="signup-error">
            {formError.map((error, idx) => (
              <div key={idx}>{error}</div>
            ))}
          </div>
        )}

        {formSuccess && (
          <div className="signup-success">
            {formSuccess}
          </div>
        )}

        {Object.keys(initialState).map(field => (
          <div className="mb-4" key={field}>
            <label className="signup-label">{field}</label>
            <input
              name={field}
              type={field === "password" ? "password" : "text"}
              value={formData[field]}
              onChange={handleChange}
              required
              className="signup-input"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={isLoading}
          className="signup-button"
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

export default SignupPage;
