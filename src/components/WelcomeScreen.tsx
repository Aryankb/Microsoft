import React from "react";
import ChatInput from "./ChatInput";

interface WelcomeScreenProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: () => void;
  mode: "workflow" | "general";
  onModeChange: (mode: "workflow" | "general") => void;
  examplePrompts: string[];
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  message,
  setMessage,
  onSend,
  mode,
  onModeChange,
  examplePrompts,
}) => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow">
      <h1 className="text-3xl font-bold mb-4 text-text">SIGMOYD</h1>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => onModeChange("workflow")}
          className={`px-4 py-2 rounded ${
            mode === "workflow"
              ? "bg-primary text-background"
              : "bg-button-secondary"
          }`}
        >
          Create Workflow
        </button>
        <button
          onClick={() => onModeChange("general")}
          className={`px-4 py-2 rounded ${
            mode === "general"
              ? "bg-primary text-background"
              : "bg-button-secondary"
          }`}
        >
          General Query
        </button>
      </div>
      <div className="relative w-full max-w-xl">
        <ChatInput
          message={message}
          setMessage={setMessage}
          onSend={onSend}
          placeholder="Send a message..."
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {examplePrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => setMessage(prompt)}
            className="px-4 py-2 bg-card rounded-full text-sm whitespace-nowrap hover:bg-button-secondary"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
