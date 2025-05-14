import { useState, useRef, useEffect } from "react";
// @ts-ignore
import VanishingMessageInput from "./VanishingMessageInput.jsx";
import BackgroundBeamsWithCollisionDemo from "./ui/background-beams-with-collision-demo";
import { JSX } from "react/jsx-runtime";
// Import icons for the dropdown menu
import { Calendar, Mail, Users, ArrowUpRight } from "lucide-react";

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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle focus and blur with smooth transitions
  const handleInputFocus = () => {
    setIsInputFocused(true);
    setIsDropdownVisible(true);
  };

  const handleInputBlur = () => {
    // Use setTimeout to allow clicking on dropdown items before hiding
    setTimeout(() => {
      setIsInputFocused(false);
      // Keep dropdown visible briefly for smooth transition
      setTimeout(() => {
        setIsDropdownVisible(false);
      }, 300);
    }, 200);
  };

  // Apply staggered animation to dropdown items
  useEffect(() => {
    if (isDropdownVisible && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('.dropdown-item');
      items.forEach((item, index) => {
        setTimeout(() => {
          (item as HTMLElement).style.opacity = '1';
          (item as HTMLElement).style.transform = 'translateY(0)';
        }, 50 + (index * 30)); // Staggered delay
      });
    }
  }, [isDropdownVisible]);

  // Get the appropriate icon for each prompt
  const getPromptIcon = (prompt: string) => {
    if (prompt.toLowerCase().includes("social media") || prompt.toLowerCase().includes("post scheduling")) {
      return <Calendar className="w-5 h-5 text-blue-400" />;
    } else if (prompt.toLowerCase().includes("email")) {
      return <Mail className="w-5 h-5 text-green-400" />;
    } else if (prompt.toLowerCase().includes("customer") || prompt.toLowerCase().includes("onboarding")) {
      return <Users className="w-5 h-5 text-purple-400" />;
    } else {
      return <ArrowUpRight className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col space-y-6 h-full">
      {chats.length === 0 && !showWorkflow ? (
        <div className="flex flex-col items-center justify-center flex-grow h-screen overflow-hidden">
          <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
            <BackgroundBeamsWithCollisionDemo />
          </div>

          <div className="relative z-30 flex flex-col items-center max-w-xl w-full px-4">
            <div className="w-full mb-8 relative">
              {/* Fixed height container to prevent layout shifts */}
              <div className="min-h-[180px]">
                <VanishingMessageInput
                  message={message}
                  setMessage={setMessage}
                  handleSend={handleSend}
                  showWorkflow={showWorkflow}
                  handleQueryUpdate={handleQueryUpdate}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />

                <div 
                  ref={dropdownRef}
                  className={`absolute w-full mt-1 bg-[#222222] border border-gray-700 rounded-md shadow-lg z-50 overflow-hidden transition-all duration-300 ease-in-out ${
                    isInputFocused 
                      ? 'opacity-100 max-h-[300px]' 
                      : 'opacity-0 max-h-0 pointer-events-none'
                  }`}
                  style={{
                    transformOrigin: 'top center',
                    transform: isInputFocused ? 'scaleY(1)' : 'scaleY(0.95)',
                  }}
                >
                  {examplePrompts.length > 0 && isDropdownVisible && examplePrompts.map((prompt, index) => (
                    <div
                      key={index}
                      className="dropdown-item px-4 py-3 hover:bg-[#333333] cursor-pointer text-gray-200 flex items-center gap-3 transition-all duration-200 ease-out opacity-0"
                      style={{ 
                        transform: 'translateY(10px)',
                        transitionProperty: 'background-color, opacity, transform',
                      }}
                      onClick={() => {
                        setMessage(prompt);
                        setIsInputFocused(false);
                      }}
                    >
                      <div className="flex-shrink-0 bg-[#444444] p-2 rounded-full transition-transform duration-200 ease-out hover:scale-110">
                        {getPromptIcon(prompt)}
                      </div>
                      <span className="transition-colors duration-200">{prompt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
