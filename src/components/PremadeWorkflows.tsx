import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import "./PremadeWorkflows.css";

export default function PremadeWorkflows() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to navigate back to the home page
  const handleHomeClick = () => {
    navigate("/");
  };

  useEffect(() => {
    const fetchPublicWorkflows = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await fetch(
          "https://backend.sigmoyd.in/fetch_public",
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
        console.log("API Response:", data); // Debug the response structure

        // Handle the specific response format from the backend
        if (data && typeof data === "object") {
          if (data.workflows && Array.isArray(data.workflows)) {
            // The API returns { workflows: [...] }
            setWorkflows(data.workflows);
          } else if (Array.isArray(data)) {
            // In case the API returns direct array
            setWorkflows(data);
          } else {
            // Fallback for other object formats
            const workflowsArray = Object.values(data).filter(
              (item) => item && typeof item === "object"
            );
            setWorkflows(workflowsArray);
          }
        } else {
          // Default to empty array if the response is invalid
          setWorkflows([]);
          console.error("Invalid API response format:", data);
          setError("Received invalid data format from server");
        }
      } catch (error) {
        console.error("Error fetching public workflows:", error);
        setError("Failed to load public workflows");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicWorkflows();
  }, [getToken]);

  const handleWorkflowClick = (workflow) => {
    // Pass complete workflow data as state to avoid additional API calls
    navigate(`/public-workflow/${workflow.wid}`, {
      state: { workflowData: workflow },
    });
  };

  const handleUseWorkflow = (e, workflow) => {
    e.stopPropagation(); // Prevent triggering the card click
    // Navigate to the use workflow page or trigger workflow usage
    navigate(`/use-workflow/${workflow.wid}`, {
      state: { workflowData: workflow },
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading public workflows...</span>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="premade-workflows-container">
      <div className="topbar-container">
        <TopBar
          onMenuClick={() => {}}
          onHomeClick={handleHomeClick}
          isHomePage={false}
          sidebarVisible={false}
        />
      </div>

      <main className="main-content">
        <div className="content-wrapper">
          <h1 className="page-title">Pre-made Workflows</h1>
          <p className="page-description">
            Choose from our collection of pre-built workflows to jumpstart your
            automation journey. Each workflow is ready to use or can be
            customized to fit your specific needs.
          </p>

          <div className="workflows-grid">
            {!workflows || workflows.length === 0 ? (
              <p className="no-workflows-message">
                No public workflows available
              </p>
            ) : (
              <div className="workflows-grid-layout">
                {Array.isArray(workflows) &&
                  workflows.map((workflow, index) => {
                    // Extract workflow data from json property or use direct properties
                    const workflowData = workflow.json || workflow;
                    const name =
                      workflowData.name ||
                      workflowData.workflow_name ||
                      "Unnamed Workflow";
                    const description =
                      workflowData.description ||
                      workflowData.refined_prompt ||
                      "";
                    const wid = workflow.wid || workflowData.workflow_id;
                    const likes = workflow.likes || 0;
                    const uses = workflow.uses || 0;

                    // Assign a gradient type based on index
                    const gradientClass = `workflow-card-gradient-${
                      (index % 5) + 1
                    }`;

                    return (
                      <div
                        key={wid || index}
                        className={`workflow-card ${gradientClass}`}
                        onClick={() =>
                          handleWorkflowClick({
                            wid,
                            name,
                            description,
                            likes,
                            uses,
                            json: workflowData,
                          })
                        }
                      >
                        <div className="card-glow-effect"></div>
                        <div className="card-content">
                          <h3 className="card-title">{name}</h3>
                          <p className="card-description">{description}</p>
                          <div className="card-footer">
                            <div className="card-stats">
                              <span className="stat-likes">
                                <span className="stat-icon">❤️</span> {likes}
                              </span>
                              <span className="stat-uses">
                                <span className="stat-icon">👥</span> {uses}{" "}
                                uses
                              </span>
                            </div>
                            <button
                              className="use-workflow-btn"
                              onClick={(e) =>
                                handleUseWorkflow(e, {
                                  wid,
                                  name,
                                  description,
                                  likes,
                                  uses,
                                  json: workflowData,
                                })
                              }
                            >
                              Use it
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
