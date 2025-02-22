import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import CustomNode from "./CustomNode";
import "reactflow/dist/style.css";

// Get JSON from URL
const getJsonFromUrl = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const jsonParam = queryParams.get("json");

  try {
    return jsonParam ? JSON.parse(decodeURIComponent(jsonParam)) : null;
  } catch (error) {
    console.error("Invalid JSON in URL", error);
    return null;
  }
};


const arrangeNodes = (workflow) => {
    const levels = new Map();
    const nodePositions = new Map();
    const nodeSpacingX = 300;
    const nodeSpacingY = 150;
  
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
        x: positionIndex * nodeSpacingX,
        y: level * nodeSpacingY,
      });
      levelCounts.set(level, positionIndex + 1);
    });
  
    return nodePositions;
  };

// Generate Nodes and Edges
const generateNodesAndEdges = (workflow) => {
    if (!workflow || !Array.isArray(workflow)) return { nodes: [], edges: [] };
  
    const positions = arrangeNodes(workflow);
  
    const nodes = workflow.map((node) => ({
      id: node.id.toString(),
      type: "customNode",
      position: positions.get(node.id),
      data: {
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
  
    const edges = [];
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
  
    return { nodes, edges };
  };
  

const nodeTypes = { customNode: CustomNode };

const WorkflowGraph = () => {
  const [workflowJson, setWorkflowJson] = useState(getJsonFromUrl());
  const { nodes: initialNodes, edges: initialEdges } = generateNodesAndEdges(
    workflowJson?.workflow || []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    setWorkflowJson(getJsonFromUrl());
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      {workflowJson ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      ) : (
        <h2 style={{ textAlign: "center", marginTop: "20px" }}>
          No valid JSON provided in the URL!
        </h2>
      )}
    </div>
  );
};

export default WorkflowGraph;
