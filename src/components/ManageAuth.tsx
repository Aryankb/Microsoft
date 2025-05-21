import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  ExternalLink,
  RefreshCw,
  Mail,
  FileText,
  Youtube as YoutubeIcon,
  Linkedin,
  Calendar,
  FileType,
  Table,
  BellRing,
  AlarmCheck,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TopBar from "./TopBar";
import "./ManageAuth.css";

const AUTH_SERVICES = [
  "Gmail Trigger",
  "Gmail",
  "Notion",
  "Youtube",
  "Linkedin",
  "Googlecalendar",
  "Googledocs",
  "Googlesheets",
  "Googlemeet",
];

// Service icon mapping
const SERVICE_ICONS = {
  "Gmail Trigger": <BellRing size={40} className="service-icon gmail" />,
  Gmail: <Mail size={40} className="service-icon gmail" />,
  Notion: <FileText size={40} className="service-icon notion" />,
  Youtube: <YoutubeIcon size={40} className="service-icon youtube" />,
  Linkedin: <Linkedin size={40} className="service-icon linkedin" />,
  Googlecalendar: <Calendar size={40} className="service-icon google" />,
  Googlemeet: <AlarmCheck size={40} className="service-icon google" />,
  Googledocs: <FileType size={40} className="service-icon google" />,
  Googlesheets: <Table size={40} className="service-icon google" />,
};

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
  const [comp, setComp] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [reloadingStatus, setReloadingStatus] = useState(false);

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
      setReloadingStatus(true);
      const response = await fetch("https://backend.sigmoyd.in/user_auths", {
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
        if (data.api_keys.composio) {
          setComp(true);
        }
        updateCache(data); // Update cache after fetching
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to fetch authentication data" }));
        toast.error(
          `Authentication error: ${
            errorData.message || "Failed to fetch authentication data"
          }`
        );
      }
    } catch (error) {
      toast.error(
        `Network error: ${
          error instanceof Error ? error.message : "Could not connect to server"
        }`
      );
    }
    setLoading(false);
    setReloadingStatus(false);
  };

  // Fetch user authentication status and API keys with caching
  useEffect(() => {
    const cachedData = getCachedAuthData();
    if (cachedData) {
      setAuthStatus(cachedData.user_auths || {});
      setKeys(cachedData.api_keys || {});
      if (cachedData.api_keys.composio) {
        setComp(true);
      }
      return; // Don't fetch if cache is available
    }

    const fetchAuthStatus = async () => {
      try {
        const token = await getToken();
        const response = await fetch("https://backend.sigmoyd.in/user_auths", {
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
          if (data.api_keys.composio) {
            setComp(true);
          }
          updateCache(data); // Update cache after fetching
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(
            `Failed to fetch authentication data: ${
              errorData.message || "Server error"
            }`
          );
        }
      } catch (error) {
        toast.error(
          `Network error: ${
            error instanceof Error
              ? error.message
              : "Could not connect to server"
          }`
        );
      }
    };

    fetchAuthStatus();
  }, [getToken]);

  // Handle authentication toggle and update cache
  const handleAuthToggle = async (service: string, enabled: boolean) => {
    try {
      const token = await getToken();
      const endpoint = enabled
        ? "https://backend.sigmoyd.in/auth"
        : "https://backend.sigmoyd.in/delete_auth";

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
        if (enabled) {
          console.log("Redirecting to:", authUrl.auth_url);
          window.open(authUrl.auth_url, "_blank", "noopener,noreferrer");
          toast.info(
            `Authentication window opened for ${service}. Please complete the process in the new window.`
          );
        }
      }

      if (response.ok) {
        const updatedAuthStatus = { ...authStatus, [service]: enabled };
        setAuthStatus(updatedAuthStatus);
        updateCache({ user_auths: updatedAuthStatus, api_keys: keys }); // Update cache

        if (!enabled) {
          toast.success(`Successfully disconnected ${service}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (
          errorData.detail &&
          typeof errorData.detail === "string" &&
          errorData.detail.includes("Invalid API key")
        ) {
          toast.error(
            `Invalid API key detected. Please provide valid API keys before connecting services.`
          );
        } else if (
          errorData.detail &&
          typeof errorData.detail === "string" &&
          errorData.detail.includes("in use")
        ) {
          toast.error(
            `Cannot disconnect ${service}: Service is being used by active workflows.`
          );
        } else {
          toast.error(
            `${
              enabled ? "Connection" : "Disconnection"
            } error for ${service}: ${
              errorData.message ||
              errorData.detail ||
              "Could not process request"
            }`
          );
        }
      }
    } catch (error) {
      toast.error(
        `Error processing ${service} authentication: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle API Key submission and update cache
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required keys
    if (!keys.composio) {
      setError("Composio API Key is required.");
      toast.error("Composio API Key is required.");
      return;
    }
    if (!keys.openai && !keys.gemini) {
      setError("Please enter either OpenAI or Gemini API Key.");
      toast.error("Please enter either OpenAI or Gemini API Key.");
      return;
    }

    // Validate key format
    if (keys.openai && !keys.openai.startsWith("sk-")) {
      setError("OpenAI API Key should start with 'sk-'");
      toast.error(
        "OpenAI API Key format is invalid. It should start with 'sk-'"
      );
      return;
    }

    try {
      const token = await getToken();
      console.log("API Keys:", keys);
      const response = await fetch("https://backend.sigmoyd.in/save_api_keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(keys),
      });

      if (response.ok) {
        toast.success("API Keys saved successfully!");
        setComp(true);
        updateCache({ user_auths: authStatus, api_keys: keys }); // Update cache
      } else {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.detail && typeof errorData.detail === "string") {
          if (errorData.detail.includes("Invalid OpenAI")) {
            toast.error("Invalid OpenAI API key. Please check and try again.");
          } else if (errorData.detail.includes("Invalid Gemini")) {
            toast.error("Invalid Gemini API key. Please check and try again.");
          } else if (errorData.detail.includes("Invalid Composio")) {
            toast.error(
              "Invalid Composio API key. Please check and try again."
            );
          } else {
            toast.error(`API key error: ${errorData.detail}`);
          }
        } else {
          setError("Failed to save API keys. Try again.");
          toast.error(
            `Error saving API keys: ${
              errorData.message || errorData.detail || "Please try again"
            }`
          );
        }
      }
    } catch (error) {
      setError("Error saving API keys.");
      toast.error(
        `Network error: ${
          error instanceof Error ? error.message : "Could not connect to server"
        }`
      );
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (key: string) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy key to clipboard
  const copyToClipboard = (key: string) => {
    navigator.clipboard
      .writeText(keys[key])
      .then(() =>
        toast.success(
          `${
            API_KEY_INFO[key as keyof typeof API_KEY_INFO].label
          } copied to clipboard`
        )
      )
      .catch(() => toast.error("Failed to copy to clipboard"));
  };

  // Function to redirect to API key page
  const goToApiKeyPage = (service: string) => {
    const serviceKey = service.toLowerCase() as keyof typeof API_KEY_URLS;
    const url = API_KEY_URLS[serviceKey];
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Function to navigate home
  const handleHomeClick = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        className="toast-container"
      />

      {/* Add TopBar without New Chat button and sidebar handling */}
      <TopBar
        onMenuClick={() => {}} // Empty function - sidebar disabled
        onHomeClick={handleHomeClick}
        sidebarVisible={false} // Always false - sidebar disabled
        hideNewChat={true} // Hide the New Chat button
      />

      {/* Main Content */}
      <div className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-semibold mb-6 text-text">
            Manage Authentications
          </h2>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* API Key Entry Section */}
            <div className="auth-card p-6">
              <h3 className="text-xl font-semibold mb-4 text-center text-text">
                Enter API Keys
              </h3>
              {error && <p className="text-secondary text-sm mb-3">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                {Object.keys(API_KEY_INFO).map((service) => (
                  <div key={service} className="api-key-field">
                    <label className="block text-sm font-medium mb-1 text-text-accent">
                      <div className="flex items-center">
                        <span>
                          {
                            API_KEY_INFO[service as keyof typeof API_KEY_INFO]
                              .label
                          }
                          {API_KEY_INFO[service as keyof typeof API_KEY_INFO]
                            .required && " (Required)"}
                        </span>
                        <button
                          type="button"
                          onClick={() => goToApiKeyPage(service)}
                          className="ml-2 px-2 py-1 bg-primary text-xs rounded-full flex items-center gap-1 hover:bg-opacity-80 transition-colors"
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
                    <div className="api-key-input">
                      <input
                        type={showPassword[service] ? "text" : "password"}
                        value={keys[service] || ""}
                        onChange={(e) =>
                          setKeys({ ...keys, [service]: e.target.value })
                        }
                        required={
                          API_KEY_INFO[service as keyof typeof API_KEY_INFO]
                            .required
                        }
                        placeholder={`Enter ${service} API key...`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(service)}
                      >
                        {showPassword[service] ? "🙈" : "👁️"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(service)}
                        disabled={!keys[service]}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="submit"
                  className="w-full btn-primary hover:shadow-primary-glow"
                >
                  Save API Keys
                </button>
              </form>
            </div>

            {/* Authentication Services Table */}
            <div className="auth-card p-6">
              {loading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <p className="mt-4 text-lg text-text">
                    Fetching auth status... Please wait
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-text">
                  Connected Services
                </h3>
                <button
                  onClick={fetchAuthStatus}
                  disabled={reloadingStatus}
                  className={`reload-button ${
                    reloadingStatus ? "loading" : ""
                  }`}
                  aria-label="Reload authentication status"
                >
                  <RefreshCw size={18} className="reload-icon" />
                  <span>
                    {reloadingStatus ? "Refreshing..." : "Reload Status"}
                  </span>
                </button>
              </div>

              {comp ? (
                <table className="auth-services-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AUTH_SERVICES.map((service) => (
                      <tr key={service}>
                        <td className="flex items-center gap-3">
                          {SERVICE_ICONS[service]}
                          <span>{service}</span>
                        </td>
                        <td className="text-center">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={authStatus[service] || false}
                              onChange={() =>
                                handleAuthToggle(service, !authStatus[service])
                              }
                              className="sr-only"
                            />
                            <div
                              className={`toggle-track ${
                                authStatus[service] ? "on" : "off"
                              }`}
                            >
                              <div className="toggle-thumb"></div>
                            </div>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-text-accent text-center py-8">
                  Composio API Key required
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
