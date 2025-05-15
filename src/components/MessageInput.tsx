import { KeyboardEvent, useRef } from "react";
import { Mic, Send } from "lucide-react";

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSend: () => void;
  placeholder?: string;
  onMicClick?: () => void;
  showWorkflow?: boolean;
  handleQueryUpdate?: (message: string) => void;
}

const MessageInput = ({
  message,
  setMessage,
  handleSend,
  placeholder = "Send a message...",
  onMicClick,
  showWorkflow = false,
  handleQueryUpdate,
}: MessageInputProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const autoResizeMessageInput = (element: HTMLTextAreaElement) => {
    if (!element) return;
    element.style.height = "0";
    const newHeight = Math.min(element.scrollHeight, 200); // Max height of 200px
    element.style.height = `${newHeight}px`;
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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

  return (
    <div className="relative flex-1">
      <textarea
        ref={inputRef}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          autoResizeMessageInput(e.target);
        }}
        onKeyDown={handleKeyPress}
        placeholder={message ? "" : placeholder}
        className="w-full bg-[#444444] rounded-lg px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#00ADB5] resize-none overflow-y-auto pr-14 transition-all duration-200 text-white border border-gray-600"
        style={{ minHeight: "56px", maxHeight: "150px" }}
        rows={1}
      />

      <button
        onClick={handleMicClick}
        className="absolute right-14 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors p-2 hover:bg-[#555555] rounded-full"
        aria-label="Voice input"
      >
        <Mic size={18} />
      </button>

      <button
        onClick={() =>
          showWorkflow && handleQueryUpdate
            ? handleQueryUpdate(message)
            : handleSend()
        }
        disabled={!message.trim()}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-[#00ADB5] text-white hover:shadow-[0px_0px_10px_rgba(0,173,181,0.6)] disabled:bg-[#555555] disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300"
      >
        <Send
          size={18}
          className={message.trim() ? "opacity-100" : "opacity-50"}
        />
      </button>
    </div>
  );
};

export default MessageInput;
