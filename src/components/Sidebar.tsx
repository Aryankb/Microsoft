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
      className={`fixed inset-y-0 left-0 bg-gray-900 text-text transform transition-all duration-300 ease-in-out z-50 overflow-hidden`}
      style={{ width: show ? "300px" : "0px" }}
    >
      {isDeleting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text"></div>
        </div>
      )}

      <div className="p-4 h-full flex flex-col justify-between">
        {/* Workflows Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Workflows</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded">
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button - Apply bg color directly to the div */}
          <div
            onClick={() => {
              onNewChatClick();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-4 py-3 mb-4 bg-blue-400 text-gray-900 hover:shadow-[0px_0px_10px_rgba(96,165,250,0.7)] rounded-md transition-all duration-200 font-medium cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>New Chat</span>
          </div>

          <div className="space-y-2 py-2 mt-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="relative flex items-center bg-gray-800 rounded-md overflow-hidden hover:bg-gray-700 transition-all duration-200 group"
              >
                {/* Status indicator */}
                <div
                  className={`w-1 h-full absolute left-0 top-0 ${
                    workflow.active ? "bg-green-400" : "bg-red-400"
                  }`}
                />

                {/* Workflow button - Apply bg color directly to the div */}
                <div
                  onClick={() => handleWorkflowClick(workflow.id)}
                  className={`flex-grow text-left pl-3 pr-12 py-2 transition-colors cursor-pointer ${
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
                  className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-pointer z-10"
                  onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                >
                  <div className="p-1.5 rounded-full group-hover:bg-red-500/20">
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
        <div className="border-t border-gray-600 pt-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <div>
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="text-xs text-text-accent">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <SignOutButton>
            <div className="mt-3 w-full text-left px-4 py-2 bg-red-400 text-white hover:bg-red-500 hover:shadow-md rounded transition-all cursor-pointer">
              Logout
            </div>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
