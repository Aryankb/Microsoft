import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Menu,
  Settings,
  Book,
  MessageSquare,
  Zap,
  Key,
  BarChart3,
  DollarSign,
  UploadCloud,
  Plus,
  Home,
  PlusCircle,
  Activity,
  Globe, // Added Globe icon
} from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
  onHomeClick?: () => void;
  onNewChatClick?: () => void;
  onPublicClick?: () => void; // New prop
  sidebarVisible: boolean;
  hideNewChat?: boolean;
  currentWorkflow?: {
    name: string;
    id: string;
    public?: boolean; // Added public field
  } | null;
}

const menuItems = [
  { icon: Key, label: "Add Auth" },
  { icon: BarChart3, label: "Workflow Logs" },
  // { icon: Book, label: "Documentation" },
  { icon: MessageSquare, label: "Feedback" },
  { icon: DollarSign, label: "Plans and Usage" },
  { icon: UploadCloud, label: "Collections"},
  // { icon: Plus, label: "Create Tool" },
];

export default function TopBar({
  onMenuClick,
  onHomeClick,
  onNewChatClick,
  onPublicClick,
  sidebarVisible,
  hideNewChat = false,
  currentWorkflow = null,
}: TopBarProps) {
  const navigate = useNavigate();
  const [animateWorkflowName, setAnimateWorkflowName] = useState(false);

  // Trigger animation when workflow changes
  useEffect(() => {
    if (currentWorkflow?.name) {
      setAnimateWorkflowName(true);
      const timer = setTimeout(() => setAnimateWorkflowName(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentWorkflow?.name]);

  const handleCreateTool = () => {
    navigate("/create-tool");
  };

  const handleManageAuths = () => {
    navigate("/manage-auths");
  };
  const handleCreateCollections = () => {
    navigate("/collections");
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
          {/* {!sidebarVisible && onNewChatClick && !hideNewChat && (
            <div
              onClick={onNewChatClick}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-400 text-gray-900 hover:shadow-[0px_0px_10px_rgba(96,165,250,0.7)] rounded-md transition-colors duration-300 font-medium cursor-pointer"
              title="Start a New Chat"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">New Chat</span>
            </div>
          )} */}

          {/* Creative Workflow Name Display */}
          {currentWorkflow && (
            <div className="mx-4 flex items-center">
              <span 
              className={`workflow-name ${animateWorkflowName ? 'animate-fade-in' : ''}`}
              >
              {currentWorkflow.name}
              </span>
              
              {/* Public Status Indicator */}
              {currentWorkflow && onPublicClick && (
              <div 
                onClick={!currentWorkflow.public ? onPublicClick : undefined}
                className={`ml-2 ${!currentWorkflow.public ? "cursor-pointer" : "cursor-default"}`}
                title={currentWorkflow.public ? "Public workflow" : "Make workflow public"}
              >
                <Globe 
                size={18} 
                className={currentWorkflow.public ? "text-green-500" : "text-gray-500"} 
                />
              </div>
              )}
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
                  : item.label === "Collections"
                  ? handleCreateCollections
                  : undefined
              }
            >
              <item.icon size={20} />
            </button>
          ))}
          {/* <Link to="/premade" className="nav-link">
            Pre-made Workflows
          </Link> */}
        </div>
      </div>
    </div>
  );
}
