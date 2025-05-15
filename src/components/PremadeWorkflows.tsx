import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";
import { FaStar, FaUsers, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import "./PremadeWorkflows.css";

// Dummy data for pre-made workflows
const dummyWorkflows = [
  {
    id: "wf1",
    title: "Email Marketing Automation",
    description: "Automatically send personalized emails based on user behavior and engagement metrics.",
    stars: 4.8,
    usageCount: 2543,
    previewFlow: {
      nodes: [
        { id: '1', position: { x: 10, y: 10 }, data: { label: 'Trigger' }, style: { background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '2', position: { x: 10, y: 80 }, data: { label: 'Filter Users' }, style: { background: 'var(--color-secondary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '3', position: { x: 10, y: 150 }, data: { label: 'Send Email' }, style: { background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '6px' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', style: { stroke: 'var(--color-secondary)' } },
        { id: 'e2-3', source: '2', target: '3', style: { stroke: 'var(--color-secondary)' } }
      ]
    }
  },
  {
    id: "wf2",
    title: "Social Media Scheduler",
    description: "Schedule and publish content across multiple social media platforms with automatic analytics tracking.",
    stars: 4.5,
    usageCount: 1876,
    previewFlow: {
      nodes: [
        { id: '1', position: { x: 10, y: 10 }, data: { label: 'Content Creation' }, style: { background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '2', position: { x: 10, y: 80 }, data: { label: 'Review' }, style: { background: 'var(--color-secondary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '3', position: { x: 10, y: 150 }, data: { label: 'Schedule' }, style: { background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '6px' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', style: { stroke: 'var(--color-secondary)' } },
        { id: 'e2-3', source: '2', target: '3', style: { stroke: 'var(--color-secondary)' } }
      ]
    }
  },
  {
    id: "wf3",
    title: "Customer Onboarding",
    description: "Streamline the customer onboarding process with automated welcome emails, tutorials, and follow-ups.",
    stars: 4.7,
    usageCount: 2105,
    previewFlow: {
      nodes: [
        { id: '1', position: { x: 10, y: 10 }, data: { label: 'New Signup' }, style: { background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '2', position: { x: 10, y: 80 }, data: { label: 'Welcome Email' }, style: { background: 'var(--color-secondary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '3', position: { x: 10, y: 150 }, data: { label: 'Tutorial' }, style: { background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '6px' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', style: { stroke: 'var(--color-secondary)' } },
        { id: 'e2-3', source: '2', target: '3', style: { stroke: 'var(--color-secondary)' } }
      ]
    }
  },
  {
    id: "wf4",
    title: "Lead Qualification",
    description: "Automatically qualify and score leads based on behavior, demographics, and engagement metrics.",
    stars: 4.6,
    usageCount: 1542,
    previewFlow: {
      nodes: [
        { id: '1', position: { x: 10, y: 10 }, data: { label: 'Lead Entry' }, style: { background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '2', position: { x: 10, y: 80 }, data: { label: 'Score' }, style: { background: 'var(--color-secondary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '3', position: { x: 10, y: 150 }, data: { label: 'Assign' }, style: { background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '6px' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', style: { stroke: 'var(--color-secondary)' } },
        { id: 'e2-3', source: '2', target: '3', style: { stroke: 'var(--color-secondary)' } }
      ]
    }
  },
  {
    id: "wf5",
    title: "E-commerce Order Processing",
    description: "Streamline order processing from checkout to fulfillment with automated notifications and inventory updates.",
    stars: 4.9,
    usageCount: 3025,
    previewFlow: {
      nodes: [
        { id: '1', position: { x: 10, y: 10 }, data: { label: 'Order Placed' }, style: { background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '2', position: { x: 10, y: 80 }, data: { label: 'Payment' }, style: { background: 'var(--color-secondary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '3', position: { x: 10, y: 150 }, data: { label: 'Fulfillment' }, style: { background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '6px' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', style: { stroke: 'var(--color-secondary)' } },
        { id: 'e2-3', source: '2', target: '3', style: { stroke: 'var(--color-secondary)' } }
      ]
    }
  },
  {
    id: "wf6",
    title: "Content Approval Workflow",
    description: "Streamline your content creation process with automated approval workflows and notifications.",
    stars: 4.4,
    usageCount: 1230,
    previewFlow: {
      nodes: [
        { id: '1', position: { x: 10, y: 10 }, data: { label: 'Draft' }, style: { background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '2', position: { x: 10, y: 80 }, data: { label: 'Review' }, style: { background: 'var(--color-secondary)', color: 'white', border: 'none', borderRadius: '6px' } },
        { id: '3', position: { x: 10, y: 150 }, data: { label: 'Publish' }, style: { background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '6px' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', style: { stroke: 'var(--color-secondary)' } },
        { id: 'e2-3', source: '2', target: '3', style: { stroke: 'var(--color-secondary)' } }
      ]
    }
  }
];

const WorkflowCard = ({ workflow }) => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUseWorkflow = async () => {
    setLoading(true);
    try {
      // This is where you would make an API call to import the workflow
      // For now, we'll just simulate a delay and navigate to the main layout
      setTimeout(() => {
        setLoading(false);
        navigate('/');
      }, 1000);
      
      // Future implementation:
      // const token = await getToken();
      // const response = await fetch("http://localhost:8000/import_premade_workflow", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ workflow_id: workflow.id }),
      // });
      // if (response.ok) {
      //   navigate('/');
      // }
    } catch (error) {
      console.error("Error importing workflow:", error);
      setLoading(false);
    }
  };

  return (
    <div className="workflow-card">
      <div className="workflow-card-header">
        <h3>{workflow.title}</h3>
        <div className="workflow-card-rating">
          <FaStar className="star-icon" />
          <span>{workflow.stars.toFixed(1)}</span>
        </div>
      </div>
      
      <div className="workflow-preview">
        <ReactFlow
          nodes={workflow.previewFlow.nodes}
          edges={workflow.previewFlow.edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          panOnScroll={false}
          panOnDrag={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--color-text-accent)" gap={16} size={1} variant="dots" />
        </ReactFlow>
      </div>
      
      <p className="workflow-description">{workflow.description}</p>
      
      <div className="workflow-card-footer">
        <div className="workflow-usage">
          <FaUsers className="users-icon" />
          <span>{workflow.usageCount.toLocaleString()} uses</span>
        </div>
        
        <button 
          className="use-workflow-btn" 
          onClick={handleUseWorkflow}
          disabled={loading}
        >
          {loading ? "Loading..." : (
            <>
              Use <FaArrowRight className="arrow-icon" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const PremadeWorkflows = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  
  const handleNewChatClick = () => {
    // In a real implementation, this would reset the current state
    console.log("New chat clicked");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] relative">
      <div className="fixed top-0 left-0 right-0 z-50 bg-black">
        <TopBar
          onMenuClick={() => setShowSidebar(true)}
          onNewChatClick={handleNewChatClick}
          sidebarVisible={showSidebar}
          currentWorkflow={currentWorkflow}
        />
      </div>

      <main className="flex flex-1 pt-24 pb-6 relative">
        <div className="w-full max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">Pre-made Workflows</h1>
          <p className="text-center mb-8 max-w-3xl mx-auto">
            Choose from our collection of pre-built workflows to jumpstart your automation journey. 
            Each workflow is ready to use or can be customized to fit your specific needs.
          </p>
          
          <div className="workflows-grid">
            {dummyWorkflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PremadeWorkflows;
