import { useEffect, useState } from "react";
import {
  X,
  Trash2,
  MoreVertical,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import {
  useAuth,
  useUser,
  SignOutButton,
  UserButton,
} from "@clerk/clerk-react";
interface SidebarProps {
  show: boolean;
  onClose: () => void;
  onNewChatClick: () => void; // New prop for starting a new chat
  setWorkflowJson: (json: any) => void; // Function to update workflowJson in Main Layout
  setRefinedQuery: (query: string) => void; // Function to update refinedQuery in Main Layout
  setShowWorkflow: (show: boolean) => void;
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
  currentWorkflow: string | null;
  setCurrentWorkflow: React.Dispatch<React.SetStateAction<string | null>>;
}

interface Workflow {
  id: string;
  name: string;
  json: string;
  prompt: string;
  active?: boolean;
}

export default function Sidebar({
  show,
  onClose,
  onNewChatClick,
  setWorkflowJson,
  setRefinedQuery,
  setShowWorkflow,
  workflows,
  setWorkflows,
  currentWorkflow,
  setCurrentWorkflow,
}: SidebarProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWorkflows = async () => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/sidebar_workflows", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };
  // Fetch workflows on startup
  useEffect(() => {
    fetchWorkflows();
  }, [getToken]);

  // Handle workflow selection
  const handleWorkflowClick = (workflowId: string) => {
    const selectedWorkflow = workflows.find((w) => w.id === workflowId);
    if (!selectedWorkflow) return;

    setCurrentWorkflow(workflowId);
    setWorkflowJson(JSON.parse(selectedWorkflow.json));
    console.log(JSON.parse(selectedWorkflow.json));
    setRefinedQuery(selectedWorkflow.prompt);
    setShowWorkflow(true);
  };

  // Handle workflow deletion
  const handleDeleteWorkflow = async (
    workflowId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent the workflow from being selected when clicking delete

    // Confirm deletion with the user
    if (
      !window.confirm(
        "Are you sure you want to delete this workflow? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/delete_workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workflow_id: workflowId }),
      });

      if (response.ok) {
        // If this was the currently selected workflow, clear it
        if (currentWorkflow === workflowId) {
          setCurrentWorkflow(null);
          setWorkflowJson(null);
          setRefinedQuery("");
          setShowWorkflow(false);
        }

        // Update local workflows list by removing the deleted one
        setWorkflows(workflows.filter((w) => w.id !== workflowId));
      } else {
        console.error("Failed to delete workflow");
        alert("Failed to delete workflow. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting workflow:", error);
      alert("An error occurred while trying to delete the workflow.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="sidebar-container"
      style={{
        width: show ? "300px" : "0px",
        height: "100vh", // Ensure full height
        top: 0, // Start from the very top
        zIndex: 50, // Ensure it's above other content
      }}
    >
      {isDeleting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text"></div>
        </div>
      )}

      <div className="p-4 h-full flex flex-col justify-between">
        {/* Workflows Section */}
        <div className="overflow-y-auto flex-grow">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Your Workflows</h2>
            <button onClick={onClose} className="sidebar-close-btn">
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <div
            onClick={() => {
              onNewChatClick();
              onClose();
            }}
            className="sidebar-new-chat"
          >
            <PlusCircle size={18} />
            <span>New Chat</span>
          </div>

          <div className="space-y-2 py-2 mt-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`sidebar-workflow-item ${
                  currentWorkflow === workflow.id
                    ? "sidebar-workflow-active"
                    : ""
                } group`}
              >
                {/* Status indicator */}
                <div
                  className={`sidebar-status-indicator ${
                    workflow.active ? "bg-green-500" : "bg-red-500"
                  }`}
                />

                {/* Workflow button */}
                <div
                  onClick={() => handleWorkflowClick(workflow.id)}
                  className={`sidebar-workflow-content ${
                    currentWorkflow === workflow.id
                      ? "bg-blue-200 text-gray-900"
                      : ""
                  }`}
                >
                  <div className="flex items-center w-full">
                    <span className="max-w-[210px]" title={workflow.name}>
                      {workflow.name.length > 40
                        ? workflow.name.substring(0, 20) + "..."
                        : workflow.name}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <div
                  className="sidebar-delete-btn"
                  onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                >
                  <div className="sidebar-delete-icon group-hover:bg-red-500/20">
                    <Trash2
                      size={16}
                      className="group-hover:text-red-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile and Logout Section */}
        <div className="sidebar-footer mt-auto">
          <div className="sidebar-profile">
            <UserButton />
            <div className="sidebar-profile-info">
              <p className="sidebar-profile-name">{user?.fullName}</p>
              <p className="sidebar-profile-email">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <SignOutButton>

            <div className="mt-3 w-full text-left px-4 py-2 bg-red-400 text-black hover:bg-red-500 hover:shadow-md rounded transition-all cursor-pointer">
              Logout
            </div>

          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
