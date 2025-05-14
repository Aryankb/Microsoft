import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  setWorkflowJson: (json: any) => void;
  setRefinedQuery: (query: string) => void;
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
  public?: boolean;
}

export default function Sidebar({
  show,
  onClose,
  setWorkflowJson,
  setRefinedQuery,
  setShowWorkflow,
  workflows = [],
  setWorkflows = () => {},
  currentWorkflow,
  setCurrentWorkflow,
}: SidebarProps) {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [localWorkflows, setLocalWorkflows] = useState<Workflow[]>([]);

  const fetchWorkflows = async () => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/sidebar_workflows", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();

      try {
        setWorkflows(data);
      } catch (error) {
        console.warn("Using local workflow state as fallback");
        setLocalWorkflows(data);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [getToken]);

  useEffect(() => {
    if (workflowId && workflowId !== currentWorkflow) {
      const selectedWorkflow = workflows.find((w) => w.id === workflowId);
      if (selectedWorkflow) {
        setCurrentWorkflow(workflowId);
        try {
          setWorkflowJson(JSON.parse(selectedWorkflow.json));
        } catch (error) {
          console.error("Error parsing workflow JSON:", error);
        }
        setRefinedQuery(selectedWorkflow.prompt);
        setShowWorkflow(true);
      }
    }
  }, [workflowId, workflows, currentWorkflow]);

  const handleWorkflowClick = (workflowId: string) => {
    const selectedWorkflow = workflows.find((w) => w.id === workflowId);
    if (!selectedWorkflow) return;

    setCurrentWorkflow(workflowId);
    try {
      setWorkflowJson(JSON.parse(selectedWorkflow.json));
    } catch (error) {
      console.error("Error parsing workflow JSON:", error);
    }
    setRefinedQuery(selectedWorkflow.prompt);
    setShowWorkflow(true);
    onClose();

    navigate(`/workflows/${workflowId}`, { replace: true });
  };

  const handleDeleteWorkflow = async (
    workflowId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

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
      const response = await fetch(
        `http://localhost:8000/delete_workflow/${workflowId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        if (currentWorkflow === workflowId) {
          setCurrentWorkflow(null);
          setWorkflowJson(null);
          setRefinedQuery("");
          setShowWorkflow(false);
          navigate("/workflows");
        }

        try {
          setWorkflows((prevWorkflows) =>
            prevWorkflows.filter((w) => w.id !== workflowId)
          );
        } catch (error) {
          console.warn("Using local workflow state as fallback for deletion");
          setLocalWorkflows((prevLocalWorkflows) =>
            prevLocalWorkflows.filter((w) => w.id !== workflowId)
          );
        }
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        show &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose]);

  const displayWorkflows = workflows.length > 0 ? workflows : localWorkflows;

  return (
    <div
      ref={sidebarRef}
      className="sidebar-container"
      style={{
        width: show ? "300px" : "0px",
        height: "100vh",
        top: 0,
        zIndex: 50,
      }}
    >
      {isDeleting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text"></div>
        </div>
      )}

      <div className="p-4 h-full flex flex-col justify-between">
        <div className="sidebar-header flex justify-between items-center mb-2">
          <h2 className="sidebar-title">Your Workflows</h2>
          <button onClick={onClose} className="sidebar-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          <div className="space-y-2  mt-4">
            {displayWorkflows && displayWorkflows.length > 0 ? (
              displayWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`sidebar-workflow-item ${
                    workflow.id === currentWorkflow
                      ? "sidebar-workflow-active"
                      : ""
                  } group cursor-pointer`}
                  onClick={() => handleWorkflowClick(workflow.id)}
                >
                  <div
                    className={`sidebar-status-indicator ${
                      workflow.active ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <div className="sidebar-workflow-content">
                    <div className="flex items-center w-full justify-between">
                      <span className="max-w-[210px]" title={workflow.name}>
                        {workflow.name.length > 40
                          ? workflow.name.substring(0, 20) + "..."
                          : workflow.name}
                      </span>
                      <div
                        className="sidebar-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(workflow.id, e);
                        }}
                      >
                        <div className="sidebar-delete-icon group-hover:bg-red-500/20">
                          <Trash2
                            size={16}
                            className="group-hover:text-red-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-2 py-4 text-gray-400 text-center">
                No workflows available
              </div>
            )}
          </div>
        </div>


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
