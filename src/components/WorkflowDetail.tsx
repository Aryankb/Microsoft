import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import TopBar from "./TopBar";

interface WorkflowDetail {
  wid: string;
  name: string;
  description: string;
  likes: number;
  uses: number;
  comments: Array<{
    user: string;
    text: string;
    timestamp: string;
  }>;
  json: string;
}

export default function WorkflowDetail() {
  const { wid } = useParams<{ wid: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflowDetail = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await fetch(
          `https://backend.sigmoyd.in/get_public?wid=${wid}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setWorkflow(data);
      } catch (error) {
        console.error("Error fetching workflow details:", error);
        setError("Failed to load workflow details");
      } finally {
        setLoading(false);
      }
    };

    if (wid) {
      fetchWorkflowDetail();
    }
  }, [wid, getToken]);

  const handleUseWorkflow = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `https://backend.sigmoyd.in/use_public_workflow`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ wid }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Navigate to home to use the workflow
      navigate("/");
    } catch (error) {
      console.error("Error using workflow:", error);
      setError("Failed to use this workflow");
    }
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <>
        <TopBar
          onMenuClick={() => {}}
          onHomeClick={handleHomeClick}
          sidebarVisible={false}
          hideNewChat={true}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg">Loading workflow details...</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar
          onMenuClick={() => {}}
          onHomeClick={handleHomeClick}
          sidebarVisible={false}
          hideNewChat={true}
        />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="text-red-500 text-center p-6 bg-red-100 rounded-lg">
            {error}
          </div>
        </div>
      </>
    );
  }

  if (!workflow) {
    return (
      <>
        <TopBar
          onMenuClick={() => {}}
          onHomeClick={handleHomeClick}
          sidebarVisible={false}
          hideNewChat={true}
        />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="text-center p-6 bg-gray-100 rounded-lg">
            Workflow not found
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        onMenuClick={() => {}}
        onHomeClick={handleHomeClick}
        sidebarVisible={false}
        hideNewChat={true}
      />
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">{workflow.name}</h2>
          <p className="text-text-accent mb-6">{workflow.description}</p>

          <div className="flex justify-between mb-6 p-4 bg-background rounded-lg">
            <div className="text-center">
              <span className="text-2xl">❤️</span>
              <p className="text-lg font-semibold">{workflow.likes}</p>
              <p className="text-sm text-text-accent">Likes</p>
            </div>
            <div className="text-center">
              <span className="text-2xl">👥</span>
              <p className="text-lg font-semibold">{workflow.uses}</p>
              <p className="text-sm text-text-accent">Uses</p>
            </div>
          </div>

          <button
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            onClick={handleUseWorkflow}
          >
            USE IT
          </button>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Comments</h3>
            {workflow.comments.length === 0 ? (
              <p className="text-text-accent">No comments yet</p>
            ) : (
              <div className="space-y-4">
                {workflow.comments.map((comment, index) => (
                  <div key={index} className="p-3 bg-background rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">{comment.user}</span>
                      <span className="text-sm text-text-accent">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p>{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
