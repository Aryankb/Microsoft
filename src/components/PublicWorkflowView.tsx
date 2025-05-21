import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import TopBar from "./TopBar";
import WorkflowGraph from "./WorkflowGraph";
import "./WorkflowStyles.css";

const PublicWorkflowView = () => {
  const { wid } = useParams<{ wid: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicWorkflow = async () => {
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
        console.error("Error fetching public workflow:", error);
        setError("Failed to load workflow details");
      } finally {
        setLoading(false);
      }
    };

    if (wid) {
      fetchPublicWorkflow();
    }
  }, [wid, getToken]);

  const handleHomeClick = () => {
    navigate("/");
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <TopBar
          onMenuClick={() => {}}
          onHomeClick={handleHomeClick}
          sidebarVisible={false}
          hideNewChat={true}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-white">Loading workflow...</span>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-gray-900">
        <TopBar
          onMenuClick={() => {}}
          onHomeClick={handleHomeClick}
          sidebarVisible={false}
          hideNewChat={true}
        />
        <div className="container mx-auto px-4 py-12 pt-24 text-center">
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              {error || "Workflow not found"}
            </h2>
            <p className="text-gray-300 mb-6">
              The workflow you're looking for might have been removed or is no
              longer public.
            </p>
            <button
              onClick={handleHomeClick}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <TopBar
        onMenuClick={() => {}}
        onHomeClick={handleHomeClick}
        sidebarVisible={false}
        hideNewChat={true}
      />

      <div className="container mx-auto px-4 py-6 pt-20 flex-1 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 bg-gray-800 rounded-lg p-6 h-fit">
          <h1 className="text-2xl font-bold mb-2 text-white">
            {workflow.name || "Untitled Workflow"}
          </h1>

          {workflow.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                Description
              </h3>
              <p className="text-gray-400">{workflow.description}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">
                <span className="text-blue-400">❤️</span> {workflow.likes || 0}{" "}
                likes
              </span>
              <span className="text-gray-400">
                <span className="text-green-400">👥</span> {workflow.uses || 0}{" "}
                uses
              </span>
            </div>
          </div>

          <button
            onClick={handleUseWorkflow}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Use This Workflow
          </button>
        </div>

        <div className="lg:w-2/3 bg-gray-800 rounded-lg h-[600px] overflow-hidden">
          {workflow.json && (
            <WorkflowGraph
              workflowJson={
                typeof workflow.json === "string"
                  ? JSON.parse(workflow.json)
                  : workflow.json
              }
              isPublicView={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicWorkflowView;
