import { useState } from "react";
import { useAuth } from '@clerk/clerk-react';
export default function ApiKeyPage() {
  const { getToken } = useAuth();
  const [keys, setKeys] = useState({
    openai: "",
    gemini: "",
    composio: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Ensure composio is filled and at least one of OpenAI or Gemini is provided
    if (!keys.composio) {
      setError("Composio API Key is required.");
      return;
    }
    if (!keys.openai && !keys.gemini) {
      setError("Please enter either OpenAI or Gemini API Key.");
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch("http://127.0.0.1:8000/save_api_keys", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`

         },
        body: JSON.stringify(keys),
      });

      if (response.ok) {
        alert("API Keys saved successfully!");
        setKeys({ openai: "", gemini: "", composio: "" }); // Reset fields
      } else {
        setError("Failed to save API keys. Try again.");
      }
    } catch (error) {
      setError("Error saving API keys.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Enter API Keys</h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              OpenAI API Key (Optional)
            </label>
            <input
              type="password"
              value={keys.openai}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={keys.gemini}
              onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-red-400">
              Composio API Key (Required)
            </label>
            <input
              type="password"
              value={keys.composio}
              onChange={(e) => setKeys({ ...keys, composio: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white rounded py-2 hover:bg-blue-600 transition-colors"
          >
            Save API Keys
          </button>
        </form>
      </div>
    </div>
  );
}
