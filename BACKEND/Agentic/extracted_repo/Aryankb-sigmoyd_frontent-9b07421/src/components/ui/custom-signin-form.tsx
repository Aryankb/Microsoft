"use client";
import React, { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { cn } from "../../lib/utils";
import { Mail, Linkedin } from "lucide-react";

export default function CustomSignInForm() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isPasswordStep, setIsPasswordStep] = useState(false);
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoaded) {
    return <div className="text-white">Loading...</div>;
  }

  // First check if email exists
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsCheckingEmail(true);

    try {
      const { supportedFirstFactors } = await signIn.create({
        identifier: email,
      });

      // Check if password is supported for this account
      const passwordFactor = supportedFirstFactors.find(
        (factor) => factor.strategy === "password"
      );

      if (passwordFactor) {
        setIsPasswordStep(true);
      } else {
        // If no password method is available, show an error or guide to sign up
        setError(
          "No password set for this email. Please sign up or use another method."
        );
      }
    } catch (err) {
      console.error("Error checking email:", err);
      setError("Could not verify this email address");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Complete sign in with password
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const signInAttempt = await signIn.attemptFirstFactor({
        strategy: "password",
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      console.error("Error during sign in:", err);
      setError("Invalid password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (
    provider: "oauth_google" | "oauth_linkedin"
  ) => {
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      console.error(`Error signing in with ${provider}:`, err);
      setError(`Failed to sign in with ${provider.replace("oauth_", "")}`);
    }
  };

  // Back button handler for password step
  const handleBackToEmail = () => {
    setIsPasswordStep(false);
    setError("");
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-lg bg-gray-900/90 backdrop-blur-sm p-4 md:p-8 border border-gray-700">
      <h2 className="text-xl font-bold text-white">Welcome to Sigmoyd</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-300">
        Sign in to access your workflows and automations
      </p>

      {!isPasswordStep ? (
        // Email verification step
        <form className="my-8" onSubmit={handleCheckEmail}>
          <LabelInputContainer className="mb-6">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-200"
            >
              Email Address
            </label>
            <div className="relative group/input">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="shadow-input flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white transition duration-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
              <span className="absolute inset-x-0 -bottom-px h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/input:opacity-100" />
            </div>
          </LabelInputContainer>

          {error && (
            <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-2 rounded-md border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isCheckingEmail || !email}
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 font-medium text-white shadow-lg transition-all duration-300 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-70"
          >
            {isCheckingEmail ? "Checking..." : "Continue with Email"}
            <BottomGradient />
          </button>
        </form>
      ) : (
        // Password input step
        <form className="my-8" onSubmit={handlePasswordSignIn}>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm break-all">{email}</span>
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-xs text-cyan-500 hover:text-cyan-400"
              >
                Change
              </button>
            </div>
          </div>

          <LabelInputContainer className="mb-6">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-200"
            >
              Password
            </label>
            <div className="relative group/input">
              <input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow-input flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white transition duration-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                {isPasswordVisible ? "Hide" : "Show"}
              </button>
              <span className="absolute inset-x-0 -bottom-px h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/input:opacity-100" />
            </div>
          </LabelInputContainer>

          {error && (
            <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-2 rounded-md border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 font-medium text-white shadow-lg transition-all duration-300 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-70"
          >
            {isLoading ? "Signing in..." : "Sign in"}
            <BottomGradient />
          </button>
        </form>
      )}

      <div className="my-6 flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
        <span className="text-gray-400 text-xs font-medium">
          OR CONTINUE WITH
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleOAuthSignIn("oauth_google")}
          className="group/btn relative flex h-10 w-full items-center justify-center gap-2 rounded-md bg-gray-800 font-medium text-white transition-all duration-300 hover:bg-gray-700 border border-gray-700"
          type="button"
        >
          <Mail size={16} className="text-gray-300" />
          <span>Google</span>
          <BottomGradient />
        </button>

        <button
          onClick={() => handleOAuthSignIn("oauth_linkedin")}
          className="group/btn relative flex h-10 w-full items-center justify-center gap-2 rounded-md bg-gray-800 font-medium text-white transition-all duration-300 hover:bg-gray-700 border border-gray-700"
          type="button"
        >
          <Linkedin size={16} className="text-gray-300" />
          <span>LinkedIn</span>
          <BottomGradient />
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Don't have an account?{" "}
          <a
            href="#"
            className="text-cyan-500 hover:text-cyan-400 hover:underline transition-colors"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-1.5", className)}>
      {children}
    </div>
  );
};
