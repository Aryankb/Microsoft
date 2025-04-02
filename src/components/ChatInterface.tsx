import { useState } from "react";
// @ts-ignore
import VanishingMessageInput from "./VanishingMessageInput.jsx";
import AnimatedMessageInput from "./AnimatedMessageInput";

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
        <div className="flex flex-col items-center justify-center flex-grow py-10">
          <h1 className="text-4xl font-bold mb-8">SIGMOYD</h1>
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => handleModeChange("workflow")}
              className={`px-6 py-3 rounded-lg transition-colors ${
                mode === "workflow"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Create Workflow
            </button>
            <button
              onClick={() => handleModeChange("general")}
              className={`px-6 py-3 rounded-lg transition-colors ${
                mode === "general"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              General Query
            </button>
          </div>
          <div className="relative w-full max-w-xl mb-8">
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
                  className="px-4 py-2 bg-gray-800 rounded-full text-sm whitespace-nowrap hover:bg-gray-700 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`max-w-[85%] px-5 py-3 rounded-lg shadow-sm ${
                chat.sender === "user"
                  ? "ml-auto bg-blue-500"
                  : "mr-auto bg-gray-700"
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
