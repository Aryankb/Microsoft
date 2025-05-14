import React, { useState } from 'react';
import ReactFlow from 'reactflow';
import PromptGenerator from './PromptGenerator';

const WorkflowEditor = ({ nodes, edges, setNodes }) => {
  const [showPromptGenerator, setShowPromptGenerator] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
  };

  const handlePromptGenerated = (generatedPrompt) => {
    if (!selectedNode) return;

    if (selectedNode.data.llm_prompt !== undefined) {
      const updatedNodes = nodes.map((n) => {
        if (n.id === selectedNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              llm_prompt: generatedPrompt,
            },
          };
        }
        return n;
      });
      setNodes(updatedNodes);
    } else if (selectedNode.data.validation_prompt !== undefined) {
      const updatedNodes = nodes.map((n) => {
        if (n.id === selectedNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              validation_prompt: generatedPrompt,
            },
          };
        }
        return n;
      });
      setNodes(updatedNodes);
    }
  };

  return (
    <div className="workflow-editor">
      <PromptGenerator
        isOpen={showPromptGenerator}
        onToggle={() => setShowPromptGenerator(!showPromptGenerator)}
        onPromptGenerated={handlePromptGenerated}
        currentWorkflowData={{ nodes, edges }}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
};

export default WorkflowEditor;