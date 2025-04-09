import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
} from "reactflow";
import CustomNode from "./CustomNode.tsx";
import "reactflow/dist/style.css";
import { FaPlay, FaCheckCircle, FaSave, FaBolt, FaStop } from "react-icons/fa";
import { useAuth } from "@clerk/clerk-react";

interface WorkflowNode {
  id: string | number;
  name: string;
  tool_action?: string;
  to_execute?: string[];
  description?: string;
  type?: string;
  config_inputs?: any;
  llm_prompt?: string;
  validation_prompt?: string;
  data_flow_inputs?: string[];
  data_flow_outputs?: string[];
}

interface Trigger {
  name: string;
  description: string;
  config_inputs?: any;
  output?: string;
}

interface WorkflowJson {
  trigger: Trigger;
  workflowflow_name: string;
  workflow_id: string | number;
  workflow: WorkflowNode[];
  data_flow_notebook_keys?: string[];
  active: boolean;
}
interface Workflow {
  id: string;
  name: string;
  json: string;
  prompt: string;
  active?: boolean;
}

interface WorkflowGraphProps {
  workflowJson: WorkflowJson;
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
}

const arrangeNodes = (workflow, trigger) => {
  const levels = new Map();
  const nodePositions = new Map();
  const nodeSpacingX = 300;
  const nodeSpacingY = 150;
  // levels.set("trigger", 0);
  nodePositions.set("trigger", { x: 0, y: 0 });

  // Assign layers based on dependencies
  workflow.forEach((node) => {
    let maxLevel = 0;
    node.data_flow_inputs?.forEach((input) => {
      const parentNode = workflow.find((n) =>
        n.data_flow_outputs?.includes(input)
      );
      if (parentNode) {
        maxLevel = Math.max(maxLevel, levels.get(parentNode.id) + 1 || 0);
      }
    });
    levels.set(node.id, maxLevel);
  });

  // Position nodes based on levels
  const levelCounts = new Map();
  workflow.forEach((node) => {
    const level = levels.get(node.id) || 0;
    const positionIndex = levelCounts.get(level) || 0;
    nodePositions.set(node.id, {
      x: positionIndex * nodeSpacingX + 200,
      y: level * nodeSpacingY + 200,
    });
    levelCounts.set(level, positionIndex + 1);
  });

  return nodePositions;
};


const generateNodesAndEdges = (workflowJson, handleValueChange) => {
  const { workflow, trigger, data_flow_notebook_keys } = workflowJson;
  const positions = arrangeNodes(workflow, trigger);

  const nodes = workflow
    
    .map((node) => ({
      id: node.id.toString(),
      type: "customNode",
      position: positions.get(node.id),
      data: {
        handleValueChange,
        label: node.name,
        tool_action: node.tool_action || null,
        to_execute: node.to_execute,
        connectorName: node.to_execute
          ? node.to_execute[0]
            ? `Connector ${node.to_execute[0].replace("connector_", "")}`
            : ""
          : "",
        description: node.description,
        id: node.id,
        type: node.type,
        config_inputs: node.config_inputs,
        llm_prompt: node.llm_prompt,
        validation_prompt: node.validation_prompt,
      },
    }));

  // Trigger Node
  if (trigger.name !== "TRIGGER_MANUAL") {
  nodes.push({
    id: trigger.id.toString(),
    type: "customNode",
    position: positions.get("trigger"),
    data: {
      handleValueChange,
      label: trigger.name,
      description: trigger.description,
      config_inputs: trigger.config_inputs,
      isTrigger: true,
      id: trigger.id,
      type: "TRIGGER",
    },
  });
  }
  const edges = [];
  if (trigger.output && data_flow_notebook_keys?.includes("trigger_output")) {
    workflow.forEach((node) => {
      if (node.data_flow_inputs?.includes("trigger_output")) {
        edges.push({
          id: `e${trigger.id}-${node.id}`,
          source: trigger.id.toString(),
          target: node.id.toString(),
          label: trigger.output.toString(),
          animated: true,
          style: { stroke: "blue", strokeWidth: 2 },
        });
      }
    });
  }

  workflow.forEach((node) => {
    if (node.data_flow_outputs) {
      node.data_flow_outputs.forEach((output) => {
        workflow.forEach((targetNode) => {
          if (
            targetNode.data_flow_inputs &&
            targetNode.data_flow_inputs.includes(output)
          ) {
            edges.push({
              id: `e${node.id}-${targetNode.id}-${output}`,
              source: node.id.toString(),
              target: targetNode.id.toString(),
              label: output,
              animated: true,
              style: { strokeDasharray: "5,5" },
            });
          }
        });
      });
    }
  });

  return { nodes, edges };
};

// Move nodeTypes outside component and memoize
const nodeTypes = {
  customNode: CustomNode,
};

const WorkflowGraph: React.FC<WorkflowGraphProps> = ({
  workflowJson,
  workflows,
  setWorkflows,
}) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState(workflowJson);
  // const workflowId = workflowJson.workflow_id;
  const [showSaveButton, setShowSaveButton] = useState(false); // State to show/hide save button

  // Update workflowData when workflowJson prop changes
  useEffect(() => {
    setWorkflowData(workflowJson);
    console.log("changed flow")
    
  }, [workflowJson]);
  // Add useEffect to update nodes when workflowData changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(
      workflowData,
      handleValueChange
    );
    // console.log("new nodes and edges",newNodes,newEdges)
    setNodes(newNodes);
    setEdges(newEdges);
    
    console.log("updated useeffect :",workflowJson);
  }, [workflowData]); // This will trigger when workflowData changes

  

  const handleValueChange = (nodeId, field, value, type) => {
    setWorkflowData((prevData) => {
      const newJson = JSON.parse(JSON.stringify(prevData));

      if (nodeId === "0") {
        if (type === "config") {
          newJson.trigger.config_inputs = {
            ...newJson.trigger.config_inputs,
            [field]: value,
          };
        }
      } else {
        newJson.workflow = newJson.workflow.map((node) =>
          node.id === Number(nodeId)
            ? {
                ...node,
                ...(type === "config"
                  ? { config_inputs: { ...node.config_inputs, [field]: value } }
                  : { [field]: value }),
              }
            : node
        );
      }
      console.log("updated",newJson);
      setShowSaveButton(true); // Show save button when workflowData changes
      return newJson;
    });
  };

  const saveWorkflow = async () => {
    const token = await getToken();
    try {
      const response = await fetch("http://localhost:8000/save_workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workflowjson: workflowData }),
      });

      if (!response.ok) {
        throw new Error("Failed to save workflow");
      }

      const responseData = await response.json();
      console.log("Workflow saved successfully:", responseData);
      setShowSaveButton(false); // Hide save button after successful save
    } catch (error) {
      console.error("Error saving workflow:", error);
    }
  };


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
  // const toggleActiveState = (id: string) => {
  //   setWorkflows((prevWorkflows) =>
  //     prevWorkflows.map((workflow) =>
  //       workflow.id === id ? { ...workflow, active: !workflow.active } : workflow
  //     )
  //   );
  // };

  const { nodes: initialNodes, edges: initialEdges } = generateNodesAndEdges(
    workflowJson,
    handleValueChange
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // const onConnect = useCallback(
  //   (params) => setEdges((eds) => addEdge(params, eds)),
  //   [setEdges]
  // );

  const runOrActivateWorkflow = async () => {
    const token = await getToken();
    setLoading(true);
    const url =
      workflowJson.trigger.name === "TRIGGER_MANUAL"
        ? "http://localhost:8000/run_workflow"
        : "http://localhost:8000/activate_workflow";
    console.log("🚀 Running or activating workflow:", workflowData);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Replace with your actual auth token
      },
      body: JSON.stringify({ workflowjson: workflowData }),
    });
    setLoading(false);
    if (!response.ok) {
      const responseData = await response.json();
      console.error("Failed to run or activate workflow", responseData.message);
      if (responseData.message === "Please fill in your API keys to proceed.") {
        window.location.href = "/api-keys"; // Redirect to API key page
      }
    } else {
      const responseData = await response.json();
      console.log("🚀 Workflow activated:", responseData);
      setWorkflowData(responseData.json);
      // setKey(prevKey => prevKey + 1);
      // toggleActiveState(workflowId.toString());
      fetchWorkflows();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "70px",
        bottom: "93px",
        left: "20px",
        right: "5px",
        border: "1px solid #333",
        borderRadius: "8px",
        overflow: "hidden",
        margin: "auto",
      }}
    >
      {loading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
          <p className="mt-4 text-lg">
            Activating/Deactivating workflow... Please wait
          </p>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: "var(--color-background)" }}
      >
        <MiniMap
          style={{ backgroundColor: "var(--color-card)" }}
          nodeColor="var(--color-primary)"
        />
        <Controls />
        <Background color="var(--color-text-accent)" />

        <div
          className="react-flow__panel react-flow__controls top right"
          style={{ pointerEvents: "all" }}
        ></div>
        <div
          className="react-flow__panel react-flow__controls top left"
          style={{ pointerEvents: "all" }}
        >
          <h2
            onClick={(e) => {
              const input = e.currentTarget.nextElementSibling;
              input.style.display = "block";
              input.focus();
              e.currentTarget.style.display = "none";
            }}
            style={{
              cursor: "pointer",
              fontSize: "24px",
              fontWeight: "bold",
              color: "var(--color-text)",
            }}
          >
            {workflowData.workflow_name}
          </h2>
          <input
            type="text"
            value={workflowData.workflow_name}
            onBlur={(e) => {
              e.target.style.display = "none";
              e.target.previousElementSibling.style.display = "block";
              setWorkflowData((prevData) => ({
                ...prevData,
                workflow_name: e.target.value,
              }));
            }}
            onChange={(e) =>
              setWorkflowData((prevData) => ({
                ...prevData,
                workflow_name: e.target.value,
              }))
            }
            className="px-2 py-2 border rounded bg-card text-text"
            placeholder="Workflow Name"
            style={{ display: "none" }}
          />
          <div
            onClick={runOrActivateWorkflow}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg shadow-md transition-all duration-300 mt-4 font-medium cursor-pointer ${
              workflowJson.trigger.name === "TRIGGER_MANUAL"
                ? "bg-blue-400 text-black rounded shadow hover:bg-blue-600"
                : workflowData.active
                ? "bg-red-400 text-black rounded shadow hover:bg-red-600"
                : "bg-red-400 text-black rounded shadow hover:bg-red-600"
            } hover:scale-105 active:scale-95 border border-gray-600`}
            style={{ minWidth: "180px", textAlign: "center" }}
          >
            {workflowJson.trigger.name === "TRIGGER_MANUAL" ? (
              <FaPlay />
            ) : workflowData.active ? (
              <FaStop />
            ) : (
              <FaBolt />
            )}
            <span>
              {workflowJson.trigger.name === "TRIGGER_MANUAL"
                ? "Run Workflow"
                : workflowData.active
                ? "Deactivate Workflow"
                : "Activate Workflow"}
            </span>
          </div>
         {showSaveButton && ( <div
            onClick={saveWorkflow}
          className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-md transition-all duration-300 mt-4 font-medium cursor-pointer bg-green-500 text-black rounded shadow hover:bg-green-600"
            style={{ minWidth: "180px", textAlign: "center" }}
          >
            <FaSave className="inline-block mr-2" />
            <span>
              Save Changes
            </span>
          </div>)}
        </div>
      </ReactFlow>
    </div>
  );
};
export default WorkflowGraph;
