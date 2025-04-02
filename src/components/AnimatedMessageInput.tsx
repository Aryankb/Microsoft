import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Mic, Send, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";

interface AnimatedMessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSend: () => void;
  placeholder?: string;
  onMicClick?: () => void;
  showWorkflow?: boolean;
  handleQueryUpdate?: (message: string) => void;
  isDisabled?: boolean;
}

const AnimatedMessageInput = ({
  message,
  setMessage,
  handleSend,
  placeholder = "Send a message...",
  onMicClick,
  showWorkflow = false,
  handleQueryUpdate,
  isDisabled = false,
}: AnimatedMessageInputProps) => {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Example placeholders that rotate
  const placeholders = [
    "Create a workflow for social media post scheduling...",
    "Build an email automation workflow...",
    "Design a customer onboarding workflow...",
    "Set up a Gmail integration workflow...",
    "Create a data analysis pipeline workflow...",
  ];

  // Auto-resize textarea based on content
  const autoResizeMessageInput = (element: HTMLTextAreaElement) => {
    if (!element) return;
    element.style.height = "0";
    const newHeight = Math.min(element.scrollHeight, 200); // Max height of 200px
    element.style.height = `${newHeight}px`;
  };

  // Rotating placeholders animation
  const startAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  }, [placeholders.length]);

  // Handle visibility change (tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (document.visibilityState === "visible" && !message) {
      startAnimation();
    }
  }, [message, startAnimation]);

  // Setup placeholder rotation
  useEffect(() => {
    if (!message && !isFocused) {
      startAnimation();
      document.addEventListener("visibilitychange", handleVisibilityChange);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [message, isFocused, startAnimation, handleVisibilityChange]);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isDisabled || !message.trim()) return;

      showWorkflow && handleQueryUpdate
        ? handleQueryUpdate(message)
        : handleSend();
    }
    // No preventDefault when Shift+Enter is pressed, allowing new line
  };

  const handleMicClick = () => {
    if (onMicClick) {
      onMicClick();
    } else {
      alert("Microphone functionality would be implemented here");
    }
  };

  const handleSubmit = () => {
    if (isDisabled || !message.trim()) return;

    showWorkflow && handleQueryUpdate
      ? handleQueryUpdate(message)
      : handleSend();
  };

  return (
    <div className="relative flex-1">
      <div
        className={cn(
          "flex bg-gray-700 rounded-lg overflow-hidden transition-all duration-300",
          isFocused && "ring-2 ring-blue-500"
        )}
      >
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            autoResizeMessageInput(e.target);
          }}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          disabled={isDisabled}
          className={cn(
            "w-full px-6 py-4 bg-transparent focus:outline-none resize-none overflow-y-auto",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ minHeight: "56px", maxHeight: "150px" }}
          rows={1}
        />

        <div className="flex items-center pr-3">
          <button
            onClick={handleMicClick}
            className="text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-gray-600 rounded-full mr-1"
            aria-label="Voice input"
          >
            <Mic size={18} />
          </button>

          <button
            onClick={handleSubmit}
            disabled={isDisabled || !message.trim()}
            className={cn(
              "p-2 rounded-full transition-all duration-300",
              message.trim()
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            )}
          >
            <ArrowRight
              size={18}
              className={cn(
                "transition-transform duration-300",
                message.trim() ? "translate-x-0" : "-translate-x-1 opacity-50"
              )}
            />
          </button>
        </div>
      </div>

      {/* Animated Placeholder Text */}
      {!message && (
        <div className="absolute inset-0 flex items-center pointer-events-none px-6">
          <div className="text-gray-400 truncate transition-all duration-300">
            {!isFocused && (
              <div className="relative overflow-hidden h-6">
                {placeholders.map((p, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute transition-all duration-700 ease-in-out",
                      i === currentPlaceholder
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                    )}
                  >
                    {p}
                  </div>
                ))}
              </div>
            )}
            {isFocused && <div>{placeholder}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedMessageInput;
