import { useState } from "react";
// @ts-ignore
import VanishingMessageInput from "./VanishingMessageInput.jsx";
import BackgroundBeamsWithCollisionDemo from "./ui/background-beams-with-collision-demo";

type ChatMessage = {
  id: string;
  message: string | JSX.Element;
  sender: "user" | "bot";
};

interface ChatInterfaceProps {
  chats: ChatMessage[];
  message: string;
  setMessage: (message: string) => void;
  handleSend: () => void;
  examplePrompts?: string[];
  mode: "workflow" | "general";
  handleModeChange: (mode: "workflow" | "general") => void;
  showWorkflow: boolean;
  handleQueryUpdate?: (message: string) => void;
}

const ChatInterface = ({
  chats,
  message,
  setMessage,
  handleSend,
  examplePrompts = [],
  mode,
  handleModeChange,
  showWorkflow,
  handleQueryUpdate,
}: ChatInterfaceProps) => {
  return (
    <div className="flex flex-col space-y-6 h-full">
      {chats.length === 0 && !showWorkflow ? (
        <div className="flex flex-col items-center justify-center flex-grow h-screen overflow-hidden">
          <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
            <BackgroundBeamsWithCollisionDemo />
          </div>

          <div className="relative z-30 flex flex-col items-center max-w-xl w-full px-4">
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => handleModeChange("workflow")}
                style={{
                  backgroundColor: mode === "workflow" ? "#00ADB5" : "#333333",
                  color: mode === "workflow" ? "#121212" : "#E0E0E0",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  transition: "all 0.3s",
                }}
                className="hover:shadow-[0px_0px_10px_rgba(0,173,181,0.6)]"
              >
                Create Workflow
              </button>
              <button
                onClick={() => handleModeChange("general")}
                style={{
                  backgroundColor: mode === "general" ? "#00ADB5" : "#333333",
                  color: mode === "general" ? "#121212" : "#E0E0E0",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  transition: "all 0.3s",
                }}
                className="hover:shadow-[0px_0px_10px_rgba(0,173,181,0.6)]"
              >
                General Query
              </button>
            </div>

            <div className="w-full mb-8">
              <VanishingMessageInput
                message={message}
                setMessage={setMessage}
                handleSend={handleSend}
                showWorkflow={showWorkflow}
                handleQueryUpdate={handleQueryUpdate}
              />
            </div>

            {examplePrompts.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(prompt)}
                    style={{
                      backgroundColor: "#1E1E1E",
                      borderRadius: "9999px",
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s",
                    }}
                    className="hover:bg-[var(--color-button-secondary)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`max-w-[85%] px-5 py-3 rounded-lg shadow-sm ${
                chat.sender === "user"
                  ? "ml-auto bg-[var(--color-primary)] text-[var(--color-background)]"
                  : "mr-auto bg-[var(--color-card)]"
              }`}
            >
              {chat.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
