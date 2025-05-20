import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ChevronRight, ChevronLeft, ExternalLink } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY_URLS = {
  openai: "https://platform.openai.com/api-keys",
  gemini: "https://aistudio.google.com/app/apikey",
  composio: "https://app.composio.dev/developers",
};

const ROLES = [
  "Developer",
  "Data Scientist",
  "Business Analyst",
  "Marketing Professional",
  "Product Manager",
  "Student",
  "Entrepreneur",
  "Other",
];

const DISCOVERY_SOURCES = [
  "Search Engine",
  "Social Media",
  "Friend/Colleague",
  "Online Article",
  "Conference/Event",
  "Advertisement",
  "GitHub",
  "Email Newsletter",
  "Other",
];

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

const USE_CASES = [
  "Personal Automation",
  "Business Process Automation",
  "Data Analysis",
  "Content Creation",
  "Research Assistance",
  "Education/Learning",
  "Development/Testing",
  "Customer Support",
  "Other",
];

export default function OnboardingFlow({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { getToken } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    customRole: "",
    discoverySource: "",
    customDiscovery: "",
    experienceLevel: "",
    useCase: "",
    customUseCase: "",
    organizationSize: "",
    feedbackPreference: true,
  });

  // API key states
  const [keys, setKeys] = useState<{ [key: string]: string }>({
    openai: "",
    gemini: "",
    composio: "",
  });
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 5;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (key: string) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Function to redirect to API key page
  const goToApiKeyPage = (service: string) => {
    const url = API_KEY_URLS[service as keyof typeof API_KEY_URLS];
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleSubmit = async () => {
    // Validate API keys
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

    setLoading(true);
    try {
      const token = await getToken();

      // Submit onboarding data
      const onboardingResponse = await fetch(
        "https://backend.sigmoyd.in/save_onboarding",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!onboardingResponse.ok) {
        throw new Error("Failed to save onboarding data");
      }

      // Submit API keys (reusing logic from ManageAuth)
      const keysResponse = await fetch(
        "https://backend.sigmoyd.in/save_api_keys",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(keys),
        }
      );

      if (!keysResponse.ok) {
        throw new Error("Failed to save API keys");
      }

      // Mark onboarding as complete
      const completeResponse = await fetch(
        "https://backend.sigmoyd.in/complete_onboarding",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!completeResponse.ok) {
        throw new Error("Failed to complete onboarding");
      }

      toast.success("Onboarding completed successfully!");
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(
        `Error completing onboarding: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Variants for animations
  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
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
      />

      <div className="w-full max-w-3xl p-8 rounded-xl bg-gray-800 shadow-2xl backdrop-blur-sm bg-opacity-90">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full h-2 bg-gray-600 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Start</span>
            <span>About You</span>
            <span>Use Case</span>
            <span>API Keys</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Form content with animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="min-h-[400px] flex flex-col"
          >
            {step === 1 && (
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
                  Welcome to Sigmoyd!
                </h2>
                <p className="text-center text-gray-300 mb-8">
                  We're excited to have you join us. Let's get to know you a bit
                  better to personalize your experience.
                </p>
                <img
                  src="/onboarding-welcome.svg"
                  alt="Welcome illustration"
                  className="w-64 h-64 mx-auto mb-8"
                />
                <p className="text-center text-gray-400 text-sm mb-8">
                  This will only take a few minutes. Your information helps us
                  provide you with the best experience.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  About You
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    What best describes your role?
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                    required
                  >
                    <option value="">Select a role</option>
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.role === "Other" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Please specify your role:
                    </label>
                    <input
                      type="text"
                      name="customRole"
                      value={formData.customRole}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      placeholder="Your specific role"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    How did you hear about us?
                  </label>
                  <select
                    name="discoverySource"
                    value={formData.discoverySource}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                    required
                  >
                    <option value="">Select source</option>
                    {DISCOVERY_SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.discoverySource === "Other" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Please specify how you heard about us:
                    </label>
                    <input
                      type="text"
                      name="customDiscovery"
                      value={formData.customDiscovery}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      placeholder="Where you heard about us"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    What's your experience level with automation tools?
                  </label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                  >
                    <option value="">Select experience level</option>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Your Use Case
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    What's your primary use case for Sigmoyd?
                  </label>
                  <select
                    name="useCase"
                    value={formData.useCase}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                    required
                  >
                    <option value="">Select use case</option>
                    {USE_CASES.map((useCase) => (
                      <option key={useCase} value={useCase}>
                        {useCase}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.useCase === "Other" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Please specify your use case:
                    </label>
                    <input
                      type="text"
                      name="customUseCase"
                      value={formData.customUseCase}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      placeholder="Your specific use case"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Organization size (if applicable)
                  </label>
                  <select
                    name="organizationSize"
                    value={formData.organizationSize}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
                  >
                    <option value="">Select size</option>
                    <option value="Just me">Just me</option>
                    <option value="2-10 employees">2-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-500 employees">201-500 employees</option>
                    <option value="501+ employees">501+ employees</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="flex items-center space-x-2 text-gray-300">
                    <input
                      type="checkbox"
                      name="feedbackPreference"
                      checked={formData.feedbackPreference}
                      onChange={handleInputChange}
                      className="form-checkbox h-5 w-5 text-blue-400 rounded"
                    />
                    <span>
                      I'd like to receive product updates and feedback requests
                    </span>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  API Key Setup
                </h2>
                <p className="text-gray-300 mb-6">
                  To use Sigmoyd, you'll need to provide API keys. You can get
                  these from the respective platforms.
                </p>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <div className="space-y-4">
                  {/* Composio API Key (Required) */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      <div className="flex items-center">
                        <span>Composio API Key (Required)</span>
                        <button
                          type="button"
                          onClick={() => goToApiKeyPage("composio")}
                          className="ml-2 px-2 py-1 bg-gray-700 text-xs rounded-full flex items-center gap-1 hover:bg-gray-600 transition-colors"
                          title="Get your Composio dashboard API key"
                        >
                          <ExternalLink size={12} />
                          <span>Get Key</span>
                        </button>
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.composio ? "text" : "password"}
                        value={keys.composio}
                        onChange={(e) =>
                          setKeys({ ...keys, composio: e.target.value })
                        }
                        className="w-full p-3 pl-3 pr-24 rounded-lg bg-gray-700 border border-gray-600 text-white"
                        placeholder="Enter Composio API key..."
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("composio")}
                          className="text-gray-400 hover:text-white"
                        >
                          {showPassword.composio ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* OpenAI API Key */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      <div className="flex items-center">
                        <span>OpenAI API Key (Optional)</span>
                        <button
                          type="button"
                          onClick={() => goToApiKeyPage("openai")}
                          className="ml-2 px-2 py-1 bg-gray-700 text-xs rounded-full flex items-center gap-1 hover:bg-gray-600 transition-colors"
                          title="Get an API key from OpenAI's platform"
                        >
                          <ExternalLink size={12} />
                          <span>Get Key</span>
                        </button>
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.openai ? "text" : "password"}
                        value={keys.openai}
                        onChange={(e) =>
                          setKeys({ ...keys, openai: e.target.value })
                        }
                        className="w-full p-3 pl-3 pr-24 rounded-lg bg-gray-700 border border-gray-600 text-white"
                        placeholder="Enter OpenAI API key..."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("openai")}
                          className="text-gray-400 hover:text-white"
                        >
                          {showPassword.openai ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Gemini API Key */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      <div className="flex items-center">
                        <span>Gemini API Key (Optional)</span>
                        <button
                          type="button"
                          onClick={() => goToApiKeyPage("gemini")}
                          className="ml-2 px-2 py-1 bg-gray-700 text-xs rounded-full flex items-center gap-1 hover:bg-gray-600 transition-colors"
                          title="Get an API key from Google AI Studio"
                        >
                          <ExternalLink size={12} />
                          <span>Get Key</span>
                        </button>
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.gemini ? "text" : "password"}
                        value={keys.gemini}
                        onChange={(e) =>
                          setKeys({ ...keys, gemini: e.target.value })
                        }
                        className="w-full p-3 pl-3 pr-24 rounded-lg bg-gray-700 border border-gray-600 text-white"
                        placeholder="Enter Gemini API key..."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("gemini")}
                          className="text-gray-400 hover:text-white"
                        >
                          {showPassword.gemini ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mt-4">
                    You need to provide a Composio API key and at least one of
                    OpenAI or Gemini API keys to proceed.
                  </p>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-white">
                  You're all set!
                </h2>
                <p className="text-gray-300 mb-8 max-w-md">
                  Thank you for completing the onboarding process. We're excited
                  to have you on board!
                </p>
                <div className="text-center">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      "Let's Begin!"
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
              step === 1
                ? "opacity-0 cursor-default"
                : "bg-gray-700 hover:bg-gray-600 text-white"
            }`}
            disabled={step === 1}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step < totalSteps && (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg flex items-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
