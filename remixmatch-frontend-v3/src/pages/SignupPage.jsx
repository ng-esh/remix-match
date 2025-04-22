/**
 * SignupPage Component
 * 
 * Renders a signup form for new users.
 */


import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

function SignupPage() {
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

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
      await login(formData); // Uses context login, which includes register logic
      navigate("/");
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
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

        {formError && (
          <div className="bg-red-100 text-red-800 p-2 rounded mb-4">
            {formError.join(", ")}
          </div>
        )}

        {["email", "username", "firstName", "lastName", "password"].map(field => (
          <div className="mb-4" key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {field}
            </label>
            <input
              name={field}
              type={field === "password" ? "password" : "text"}
              value={formData[field]}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

export default SignupPage;

