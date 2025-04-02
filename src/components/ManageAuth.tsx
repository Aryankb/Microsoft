import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ExternalLink } from "lucide-react";

const AUTH_SERVICES = [
  "Gmail Trigger",
  "Gmail",
  "Notion",
  "Youtube",
  "Linkedin",
  "Googlecalendar",
  "Googledocs",
  "Googlesheets",
];

// API Key URLs - Updated with more descriptive comments
const API_KEY_URLS = {
  openai: "https://platform.openai.com/api-keys", // OpenAI API key portal
  gemini: "https://aistudio.google.com/app/apikey", // Google AI Studio for Gemini keys
  composio: "https://app.composio.dev/developers", // Composio dashboard
};

// API key labels with more information
const API_KEY_INFO = {
  openai: {
    label: "OpenAI API Key",
    tooltip: "Get an API key from OpenAI's platform",
    required: false,
  },
  gemini: {
    label: "Gemini API Key",
    tooltip: "Get an API key from Google AI Studio",
    required: false,
  },
  composio: {
    label: "Composio API Key",
    tooltip: "Get your Composio dashboard API key",
    required: true,
  },
};

export default function ManageAuth() {
  const { getToken } = useAuth();
  const [authStatus, setAuthStatus] = useState<{ [key: string]: boolean }>({});
  const [keys, setKeys] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  // Function to get cached data
  const getCachedAuthData = () => {
    const cachedData = localStorage.getItem("authData");
    return cachedData ? JSON.parse(cachedData) : null;
  };

  // Function to update cache
  const updateCache = (data: {
    user_auths: { [key: string]: boolean };
    api_keys: { [key: string]: string };
  }) => {
    localStorage.setItem("authData", JSON.stringify(data));
  };
  const fetchAuthStatus = async () => {
    try {
      const token = await getToken();
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8000/user_auths", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuthStatus(data.user_auths || {});
        setKeys(data.api_keys || {});
        updateCache(data); // Update cache after fetching
      } else {
        console.error("Failed to fetch authentication data");
      }
    } catch (error) {
      console.error("Error fetching authentication data:", error);
    }
    setLoading(false);
  };

  // Fetch user authentication status and API keys with caching
  useEffect(() => {
    const cachedData = getCachedAuthData();
    if (cachedData) {
      setAuthStatus(cachedData.user_auths || {});
      setKeys(cachedData.api_keys || {});
      return; // Don't fetch if cache is available
    }

    const fetchAuthStatus = async () => {
      try {
        const token = await getToken();
        const response = await fetch("http://127.0.0.1:8000/user_auths", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAuthStatus(data.user_auths || {});
          setKeys(data.api_keys || {});
          updateCache(data); // Update cache after fetching
        } else {
          console.error("Failed to fetch authentication data");
        }
      } catch (error) {
        console.error("Error fetching authentication data:", error);
      }
    };

    fetchAuthStatus();
  }, [getToken]);

  // Handle authentication toggle and update cache
  const handleAuthToggle = async (service: string, enabled: boolean) => {
    try {
      const token = await getToken();
      const endpoint = enabled
        ? "http://127.0.0.1:8000/auth"
        : "http://127.0.0.1:8000/delete_auth";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        redirect: "manual",
        body: JSON.stringify({
          service: service.toLowerCase().replace(/\s+/g, ""),
        }),
      });

      if (response.status === 200) {
        const authUrl = await response.json();
        console.log("Redirecting to:", authUrl.auth_url);
        window.open(authUrl.auth_url, "_blank", "noopener,noreferrer");
      }

      if (response.ok) {
        const updatedAuthStatus = { ...authStatus, [service]: enabled };
        setAuthStatus(updatedAuthStatus);
        updateCache({ user_auths: updatedAuthStatus, api_keys: keys }); // Update cache
      } else {
        console.error(`Failed to update auth for ${service}`);
        if (!enabled) {
          alert("Cannot delete auth");
        }
      }
    } catch (error) {
      console.error(`Error updating auth for ${service}:`, error);
    }
  };

  // Handle API Key submission and update cache
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(keys),
      });

      if (response.ok) {
        alert("API Keys saved successfully!");
        updateCache({ user_auths: authStatus, api_keys: keys }); // Update cache
      } else {
        setError("Failed to save API keys. Try again.");
      }
    } catch (error) {
      setError("Error saving API keys.");
      console.error(error);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (key: string) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy key to clipboard
  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(keys[key]);
    alert(`${key} API Key copied!`);
  };

  // Function to redirect to API key page
  const goToApiKeyPage = (service: string) => {
    const serviceKey = service.toLowerCase() as keyof typeof API_KEY_URLS;
    const url = API_KEY_URLS[serviceKey];
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="h-screen flex flex-col items-center bg-gray-900 text-white p-6">
      <h2 className="text-3xl font-semibold mb-6">Manage Authentications</h2>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* API Key Entry Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-center">
            Enter API Keys
          </h3>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.keys(API_KEY_INFO).map((service) => (
              <div key={service} className="relative">
                <label className="block text-sm font-medium mb-1">
                  <div className="flex items-center">
                    <span>
                      {API_KEY_INFO[service as keyof typeof API_KEY_INFO].label}
                      {API_KEY_INFO[service as keyof typeof API_KEY_INFO]
                        .required && " (Required)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => goToApiKeyPage(service)}
                      className="ml-2 px-2 py-1 bg-blue-600 text-xs rounded-full flex items-center gap-1 hover:bg-blue-700 transition-colors"
                      title={
                        API_KEY_INFO[service as keyof typeof API_KEY_INFO]
                          .tooltip
                      }
                    >
                      <ExternalLink size={12} />
                      <span>Get Key</span>
                    </button>
                  </div>
                </label>
                <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                  <input
                    type={showPassword[service] ? "text" : "password"}
                    value={keys[service] || ""}
                    onChange={(e) =>
                      setKeys({ ...keys, [service]: e.target.value })
                    }
                    className="flex-grow bg-transparent outline-none"
                    required={
                      API_KEY_INFO[service as keyof typeof API_KEY_INFO]
                        .required
                    }
                    placeholder={`Enter ${service} API key...`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(service)}
                    className="ml-2 text-gray-400 hover:text-white"
                  >
                    {showPassword[service] ? "🙈" : "👁️"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(service)}
                    className="ml-2 text-gray-400 hover:text-white"
                    disabled={!keys[service]}
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white rounded py-2"
            >
              Save API Keys
            </button>
          </form>
        </div>

        {/* Authentication Services Table */}

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          {loading && (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
              <p className="mt-4 text-lg">
                fetching auth status... Please wait
              </p>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Connected Services</h3>
            <button
              onClick={fetchAuthStatus}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              🔄 Reload
            </button>
          </div>

          {Object.keys(keys).length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-2">Service</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {AUTH_SERVICES.map((service) => (
                  <tr key={service} className="border-t border-gray-700">
                    <td className="p-2">{service}</td>
                    <td className="p-2 text-center">
                      <label className="relative flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={authStatus[service] || false}
                          onChange={() =>
                            handleAuthToggle(service, !authStatus[service])
                          }
                          className="sr-only peer"
                        />
                        <div
                          className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                            authStatus[service] ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition ${
                              authStatus[service]
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          ></div>
                        </div>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-center">
              No API keys entered yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
