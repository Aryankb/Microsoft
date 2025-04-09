import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Settings,
  Book,
  MessageSquare,
  Zap,
  Key,
  BarChart3,
  DollarSign,
  Plus,
  Home,
  PlusCircle,
} from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
  onHomeClick?: () => void;
  onNewChatClick?: () => void; // Make optional
  sidebarVisible: boolean;
  hideNewChat?: boolean; // Add prop to hide New Chat button
}

const menuItems = [
  { icon: Key, label: "Add Auth" },
  { icon: Zap, label: "Your Triggers" },
  { icon: BarChart3, label: "Workflow Logs" },
  { icon: Book, label: "Documentation" },
  { icon: MessageSquare, label: "Feedback" },
  { icon: DollarSign, label: "Plans and Usage" },
  { icon: Settings, label: "Your Collections" },
  { icon: Plus, label: "Create Tool" },
];

export default function TopBar({
  onMenuClick,
  onHomeClick,
  onNewChatClick,
  sidebarVisible,
  hideNewChat = false, // Default to showing the button
}: TopBarProps) {
  const navigate = useNavigate();

  const handleCreateTool = () => {
    navigate("/create-tool");
  };

  const handleManageAuths = () => {
    navigate("/manage-auths");
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-black border-b border-gray-700 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-button-secondary rounded"
          >
            <Menu size={25} />
          </button>

          {/* Home Button */}
          {onHomeClick && (
            <div
              onClick={onHomeClick}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-400 text-gray-900 hover:shadow-[0px_0px_10px_rgba(96,165,250,0.7)] rounded-md transition-colors duration-300 font-medium cursor-pointer"
              title="Home"
            >
              <Home size={18} />
              <span className="hidden sm:inline">Home</span>
            </div>
          )}

          {/* New Chat Button - Only show when sidebar is closed and not explicitly hidden */}
          {!sidebarVisible && onNewChatClick && !hideNewChat && (
            <div
              onClick={onNewChatClick}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-400 text-gray-900 hover:shadow-[0px_0px_10px_rgba(96,165,250,0.7)] rounded-md transition-colors duration-300 font-medium cursor-pointer"
              title="Start a New Chat"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">New Chat</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="p-2 hover:bg-button-secondary rounded"
              title={item.label}
              onClick={
                item.label === "Add Auth"
                  ? handleManageAuths
                  : item.label === "Create Tool"
                  ? handleCreateTool
                  : undefined
              }
            >
              <item.icon size={20} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
