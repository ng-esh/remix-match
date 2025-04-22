
/**
 * LoginPage Component
 * 
 * Renders a login form and handles login logic.
 */

import React, { useState, UseContext } from "react";
import RemixMatchApi from "../api/RemixMatchApi";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

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
      navigate("/");         // ✅ redirect on success (optional)
    } catch (err) {
      setFormError(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-8 max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>

        {formError && (
          <div className="bg-red-100 text-red-800 p-2 rounded mb-4">
            {formError.join(", ")}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}


export default LoginPage;
