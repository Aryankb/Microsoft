import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  
  // Add a ref to track if we've done a redirection to prevent multiple redirects
  const hasRedirected = useRef(false);
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(workflowId || null);
  const [workflowJson, setWorkflowJson] = useState(null);
  const [refinedQuery, setRefinedQuery] = useState("");
  const [showWorkflow, setShowWorkflow] = useState(false);
  
  // Determine if we're on the home page - use a ref to store this value
  const isHomePage = location.pathname === '/';
  const isHomePageRef = useRef(isHomePage);
  
  // Update the ref when the path changes
  useEffect(() => {
    isHomePageRef.current = location.pathname === '/';
    
    // When navigating to home page, reset the redirection flag
    if (location.pathname === '/') {
      hasRedirected.current = false;
    }
  }, [location.pathname]);
  
  // Fetch workflows on initial load
  useEffect(() => {
    const fetchWorkflows = async () => {
      // IMPORTANT: Skip fetching if we're on the home page to prevent any chance of redirection
      if (isHomePageRef.current) {
        return;
      }
      
      try {
        const token = await getToken();
        const response = await fetch("http://localhost:8000/sidebar_workflows", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        setWorkflows(data);
        
        // CRITICAL FIX: Multiple safeguards to prevent redirection from home page
        // 1. Check we're EXACTLY on /workflows path
        // 2. Check we're NOT on the home page (using the ref)
        // 3. Check we haven't already done a redirection
        // 4. Check there's no workflowId already in the URL
        if (
          data.length > 0 && 
          location.pathname === '/workflows' && 
          !isHomePageRef.current &&
          !hasRedirected.current &&
          !workflowId
        ) {
          hasRedirected.current = true;
          navigate(`/workflows/${data[0].id}`, { replace: true });
        }
      } catch (error) {
        console.error("Error fetching workflows:", error);
      }
    };

    fetchWorkflows();
  }, [getToken, navigate, workflowId, location.pathname]);
  
  // When the path is exactly '/', fetch workflows without redirection
  useEffect(() => {
    const fetchHomeWorkflows = async () => {
      if (location.pathname === '/') {
        try {
          const token = await getToken();
          const response = await fetch("http://localhost:8000/sidebar_workflows", {
            headers: { Authorization: `Bearer ${token}` },
          });
  
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  
          const data = await response.json();
          setWorkflows(data);
        } catch (error) {
          console.error("Error fetching workflows for home:", error);
        }
      }
    };
    
    fetchHomeWorkflows();
  }, [location.pathname, getToken]);
  
  // Handle workflow ID from URL - only when not on home page
  useEffect(() => {
    // Don't set workflow when on the home page
    if (isHomePage) {
      return;
    }
    
    if (workflowId && workflowId !== 'new') {
      setCurrentWorkflow(workflowId);
      
      // Find the current workflow in our list
      const selectedWorkflow = workflows.find(w => w.id === workflowId);
      if (selectedWorkflow) {
        try {
          setWorkflowJson(JSON.parse(selectedWorkflow.json));
          setRefinedQuery(selectedWorkflow.prompt);
          setShowWorkflow(true);
        } catch (error) {
          console.error("Error parsing workflow JSON:", error);
        }
      }
    } else if (workflowId === 'new') {
      setShowWorkflow(false);
      setWorkflowJson(null);
    }
  }, [workflowId, workflows, isHomePage]);

  // Handle Home button click - clear workflow state
  const handleHomeClick = () => {
    // Clear current workflow selection when going home
    setCurrentWorkflow(null);
    setWorkflowJson(null);
    setShowWorkflow(false);
    hasRedirected.current = false; // Reset redirection flag
    navigate('/');
  };

  // Handle New Chat button click
  const handleNewChatClick = () => {
    navigate('/workflows/new');
  };

  // Get current workflow details for TopBar
  const currentWorkflowDetails = !isHomePage && currentWorkflow 
    ? { 
        id: currentWorkflow,
        name: workflows.find(w => w.id === currentWorkflow)?.name || 'Workflow',
        public: workflows.find(w => w.id === currentWorkflow)?.public || false
      } 
    : null;

  return (
    <div className="flex flex-col h-screen bg-background text-text">
      <TopBar 
        onMenuClick={() => setShowSidebar(true)}
        onHomeClick={handleHomeClick}
        onNewChatClick={handleNewChatClick}
        sidebarVisible={showSidebar}
        hideNewChat={isHomePage} // Hide new chat button on home page
        currentWorkflow={currentWorkflowDetails}
      />
      
      <div className="flex flex-1 overflow-hidden mt-16"> {/* Added margin-top for the fixed header */}
        <Sidebar
          show={showSidebar}
          onClose={() => setShowSidebar(false)}
          workflows={workflows}
          setWorkflows={setWorkflows}
          currentWorkflow={currentWorkflow}
          setCurrentWorkflow={setCurrentWorkflow}
          setWorkflowJson={setWorkflowJson}
          setRefinedQuery={setRefinedQuery}
          setShowWorkflow={setShowWorkflow}
        />
        
        <main className="flex-1 overflow-auto relative">
          <Outlet context={{
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
          }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
