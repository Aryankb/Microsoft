import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import WorkflowGraph from './WorkflowGraph';

const WorkflowContainer = () => {
  const { workflowId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  // Get context from parent Layout
  const {
    workflowJson,
    setWorkflowJson,
    workflows,
    setWorkflows,
    currentWorkflow,
    setCurrentWorkflow,
    refinedQuery,
    setRefinedQuery,
    showWorkflow,
    setShowWorkflow
  } = useOutletContext<any>();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle incoming state from navigation (like when coming from Home page)
  useEffect(() => {
    if (location.state) {
      console.log("Received state from navigation:", location.state);
      const { newWorkflow, workflowJson: newWorkflowJson, refinedQuery: newRefinedQuery } = location.state;
      
      if (newWorkflow && newWorkflowJson) {
        // Set the new workflow data in the context
        setWorkflowJson(newWorkflowJson);
        if (newRefinedQuery) setRefinedQuery(newRefinedQuery);
        setShowWorkflow(true);
        setCurrentWorkflow(workflowId || null);
        
        // Clear the location state to prevent reapplying on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, setWorkflowJson, setRefinedQuery, setShowWorkflow, setCurrentWorkflow, workflowId]);

  // Fetch specific workflow when ID changes
  useEffect(() => {
    const fetchWorkflowData = async () => {
      if (!workflowId || workflowId === 'new') return;
      
      setLoading(true);
      try {
        // First try to find the workflow in our already fetched workflows
        const existingWorkflow = workflows.find(w => w.id === workflowId);
        
        if (existingWorkflow) {
          // We already have this workflow data in state, use it
          setCurrentWorkflow(workflowId);
          try {
            setWorkflowJson(JSON.parse(existingWorkflow.json));
            setRefinedQuery(existingWorkflow.prompt);
            setShowWorkflow(true);
            setLoading(false);
            return;
          } catch (err) {
            console.error("Error parsing workflow JSON:", err);
          }
        }
        
        // If we can't find it locally or can't parse the JSON, fetch from server
        const token = await getToken();
        const response = await fetch(`http://localhost:8000/sidebar_workflows`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const allWorkflows = await response.json();
        const workflowData = allWorkflows.find((w: any) => w.id === workflowId);
        
        if (!workflowData) {
          throw new Error(`Workflow with ID ${workflowId} not found`);
        }
        
        setCurrentWorkflow(workflowId);
        setWorkflowJson(JSON.parse(workflowData.json));
        setRefinedQuery(workflowData.prompt);
        setShowWorkflow(true);
      } catch (error) {
        console.error("Error fetching workflow data:", error);
        setError("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowData();
  }, [workflowId, getToken, workflows]);

  // If we have workflow data from navigation state, skip loading
  if (location.state?.workflowJson && !loading) {
    // Render the workflow graph immediately with the data from state
    return (
      <WorkflowGraph 
        workflowJson={location.state.workflowJson}
        workflows={workflows}
        setWorkflows={setWorkflows}
        currentWorkflow={workflowId}
        setCurrentWorkflow={(id) => {
          setCurrentWorkflow(id);
          navigate(`/workflows/${id}`);
        }}
      />
    );
  }

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading workflow...</div>;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-6">
        <p>{error}</p>
        <button 
          onClick={() => navigate('/workflows')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // For new workflow case
  if (workflowId === 'new') {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Create New Workflow</h2>
        {refinedQuery && (
          <div className="bg-gray-800 p-4 rounded-md mb-4 text-left">
            <h3 className="text-lg font-semibold mb-2">Your Request:</h3>
            <p className="text-gray-300">{refinedQuery}</p>
            <button 
              onClick={() => {
                // Add your workflow generation logic here
                // handleGenerateWorkflow();
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Generate Workflow
            </button>
          </div>
        )}
      </div>
    );
  }

  // No workflow available
  if (!workflowJson) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        {workflows && workflows.length > 0 ? (
          <p>Select a workflow from the sidebar</p>
        ) : (
          <>
            <p>No workflows available</p>
            <button 
              onClick={() => navigate('/workflows/new')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create New Workflow
            </button>
          </>
        )}
      </div>
    );
  }

  // Render workflow graph
  return (
    <WorkflowGraph 
      workflowJson={workflowJson}
      workflows={workflows}
      setWorkflows={setWorkflows}
      currentWorkflow={currentWorkflow}
      setCurrentWorkflow={(id) => {
        setCurrentWorkflow(id);
        navigate(`/workflows/${id}`);
      }}
    />
  );
};

export default WorkflowContainer;
