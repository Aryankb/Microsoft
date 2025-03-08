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
import CustomNode from './CustomNode.tsx';
import "reactflow/dist/style.css";
import axios from "axios";
import { FaPlay, FaCheckCircle, FaSave, FaBolt } from "react-icons/fa";

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
}

interface WorkflowGraphProps {
  workflowJson: WorkflowJson;
}

const arrangeNodes = (workflow,trigger) => {
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
        x: positionIndex * nodeSpacingX+200,
        y: level * nodeSpacingY+200,
      });
      levelCounts.set(level, positionIndex + 1);
    });
  
    return nodePositions;
  };

const generateNodesAndEdges = (workflowJson,handleValueChange) => {
    // if (!workflow || !Array.isArray(workflow)) return { nodes: [], edges: [] };
    const { workflow, trigger, data_flow_notebook_keys } = workflowJson;
    // console.log("Workflow:", workflow);
    // console.log("Trigger:", trigger.id);
    const positions = arrangeNodes(workflow,trigger);
    
    const nodes = workflow.map((node) => ({
      id: node.id.toString(),
      type: "customNode",
      position: positions.get(node.id),
      data: {
        handleValueChange, // Pass the function to the node
        label: node.name,
        tool_action: node.tool_action || null,
        to_execute: node.to_execute,
        connectorName: node.to_execute
          ? `Connector ${node.to_execute[0].replace("connector_", "")}`
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
  nodes.push({
    id: trigger.id.toString(),
    type: "customNode",
    position: positions.get("trigger"),
    data: {
      handleValueChange, // ✅ Pass function to trigger node too
      label: trigger.name,
      description: trigger.description,
      config_inputs: trigger.config_inputs,
      isTrigger: true,
      id:trigger.id,
      type: "TRIGGER",
    },
  });
    const edges = [];
    // Trigger edges if output exists
    
  if (trigger.output && data_flow_notebook_keys?.includes("trigger_output")) {
    
    workflow.forEach((node) => {
      if (node.data_flow_inputs?.includes("trigger_output")) {
        // console.log("Trigger Output:", trigger.output);
        edges.push({
          id: `e${trigger.id}-${node.id}`,
          source: trigger.id.toString(),
          target: node.id.toString(),
          label: (trigger.output).toString(),
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
                label: output, // Show key name on edge
                animated: true,
                style: { strokeDasharray: "5,5" },
              });
            }
          });
        });
      }
    });
 
    // console.log("Nodes:", nodes);
    // console.log("Edges:", edges);
    return { nodes, edges };
  };

// Move nodeTypes outside component and memoize
const nodeTypes = {
  customNode: CustomNode,
};

const WorkflowGraph: React.FC<WorkflowGraphProps> = ({ workflowJson }) => {

  const [workflowData, setWorkflowData] = useState(workflowJson);
  const workflowId = workflowJson.workflow_id;
  useEffect(() => {
    console.log("🔥 Workflow Data Updated USE EFFECT:", workflowData);
  }, [workflowData]); // ✅ Now logs AFTER state updates
  const handleValueChange = (nodeId, field, value, type) => {
    console.log(`🔥 handleValueChange called: node ${nodeId}, field: ${field}, value:`, value, `type: ${type}`);
  
    setWorkflowData((prevData) => {
      // ✅ 1. Deep Clone the JSON
      const newJson = JSON.parse(JSON.stringify(prevData)); 
      
      if (nodeId === '0') {
        // ✅ 2. Update `config_inputs` inside `trigger`
        if (type === "config") {
          newJson.trigger.config_inputs = {
            ...newJson.trigger.config_inputs,
            [field]: value, // ✅ Ensure a new object reference
          };

        }
        
      } else {
        // ✅ 3. Update `workflow` nodes
        console.log("yaaaaaaaa!!",typeof nodeId, typeof newJson.workflow[0].id);
        newJson.workflow = newJson.workflow.map((node) =>
          
          node.id === Number(nodeId)
            ? {
                ...node,
                ...(type === "config"
                  ? { config_inputs: { ...node.config_inputs, [field]: value } } // ✅ Update `config_inputs`
                  : { [field]: value } // ✅ Update `llm_prompt` or `validation_prompt`
                ),
              }
            : node
        );
      }
  
      console.log("🚀 Updated Workflow Data:", newJson); // ✅ Logs correct JSON before updating state
      return newJson; // ✅ Returning a new object to trigger re-render
    });
  };

  
  
  
  
  
  
  const { nodes: initialNodes, edges: initialEdges } = generateNodesAndEdges(workflowJson, handleValueChange);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);


  const saveWorkflow = async () => {

    console.log("Updated JSON:", workflowData);
    await axios.post("/save_workflow", workflowData);
  };
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  


  const runOrActivateWorkflow = async () => {
    const url = workflowJson.trigger.name === "TRIGGER_MANUAL" ? "/run_workflow" : "/activate_workflow";
    await axios.post(url, { workflow_id: workflowId });
  };

  return (
    <div style={{ height: "calc(100vh - 100px)", width: "100%", border: "1px solid #333", borderRadius: "8px" ,overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}>
        <button onClick={saveWorkflow} style={{ marginRight: "10px" }}>
          <FaSave /> Save Workflow
        </button>
        <button onClick={runOrActivateWorkflow}>
          {workflowJson.trigger.name === "TRIGGER_MANUAL" ? <FaPlay /> : <FaBolt />} 
          {workflowJson.trigger.name === "TRIGGER_MANUAL" ? "Run Workflow" : "Activate Workflow"}
        </button>
      </div>
      
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}onConnect={onConnect} nodeTypes={nodeTypes} fitView style={{ background: "#1a1a1a" }}>
    
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};
export default WorkflowGraph; 