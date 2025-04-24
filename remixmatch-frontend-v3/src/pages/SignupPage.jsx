/**
 * SignupPage Component
 * 
 * Renders a signup form for new users.
 */

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "../styles/SignupPage.css";

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useContext(UserContext); // ✅ now using signup instead of login

  const initialState = {
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    password: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [formError, setFormError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(evt) {
    const { name, value } = evt.target;
    setFormData(data => ({ ...data, [name]: value }));
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    setIsLoading(true);
    setFormError(null);
    try {
      await signup(formData); // ✅ fixed to call signup()
      navigate("/feed");
    } catch (err) {
      setFormError(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-form">
        <h2 className="signup-title">Sign Up</h2>

        {formError && (
          <div className="signup-error">
            {formError.join(", ")}
          </div>
        )}

        {["email", "username", "firstName", "lastName", "password"].map(field => (
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
