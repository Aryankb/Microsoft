import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface VanishingMessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSend: () => void;
  placeholder?: string;
  showWorkflow?: boolean;
  handleQueryUpdate?: (query: string) => void;
  isDisabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const VanishingMessageInput = ({
  message,
  setMessage,
  handleSend,
  placeholder = "Send a message...",
  showWorkflow = false,
  handleQueryUpdate,
  isDisabled = false,
  onFocus,
  onBlur
}: VanishingMessageInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Adjust textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (handleSend && !isDisabled) {
        handleSend();
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  return (
    <div
      className={`flex items-center p-2 rounded-lg transition-all duration-300 ${
        isFocused
          ? "bg-gray-700 shadow-lg border border-gray-600"
          : "bg-gray-800 border border-gray-700"
      }`}
    >
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isDisabled}
        className="flex-grow bg-transparent outline-none resize-none min-h-[40px] max-h-[200px] px-2 py-1 text-[var(--color-text)]"
        rows={1}
      />
      <button
        onClick={showWorkflow ? 
          () => handleQueryUpdate && handleQueryUpdate(message) : 
          handleSend
        }
        disabled={!message.trim() || isDisabled}
        className={`p-2 rounded-full transition-all ${
          !message.trim() || isDisabled
            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-[var(--color-primary)] text-black hover:shadow-md active:scale-95"
        }`}
      >
        <Send size={20} />
      </button>
    </div>
  );
};

export default VanishingMessageInput;
