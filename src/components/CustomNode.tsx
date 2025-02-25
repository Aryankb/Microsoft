import React from "react";
import { Handle } from "reactflow";
import { Tooltip } from "react-tooltip";
import "./CustomNode.css";

interface CustomNodeData {
  id: string | number;
  label: string;
  type: string;
  tool_action?: string;
  to_execute?: [string, string];
  connectorName?: string;
  description?: string;
  config_inputs?: string[];
  llm_prompt?: string;
  validation_prompt?: string;
}

interface CustomNodeProps {
  data: CustomNodeData;
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  // Determine node class based on type
  const nodeClass = data.type === "llm" 
    ? "node-llm" 
    : data.type === "connector" 
    ? "node-connector" 
    : "node-tool";

  return (
    <div className={`custom-node ${nodeClass}`}>
      <div className="node-header">
        <span className="node-title">{data.id}.{data.label}</span>
        {data.tool_action && <span className="node-action">({data.tool_action})</span>}

        {/* "i" Button for Tooltip */}
        <span className="info-icon" data-tooltip-id={`tooltip-${data.id}`}>
          ℹ️
        </span>
        <Tooltip id={`tooltip-${data.id}`} place="top" effect="solid">
          <div><strong>ID:</strong> {data.id}</div>
          <div><strong>Type:</strong> {data.type}</div>
          <div><strong>Description:</strong> {data.description}</div>
        </Tooltip>
      </div>

      {/* Execution Mark */}
      {data.to_execute && (
        <div
          className={`execution-mark ${data.to_execute[1] === "Y" ? "green" : "red"}`}
        >
          {data.connectorName}
        </div>
      )}

      {/* Show Config Inputs if not empty */}
      {data.config_inputs && data.config_inputs.length > 0 && (
        <div className="node-section">
          <strong>Config Inputs:</strong>
          {data.config_inputs.map((input, index) => (
            <div key={index}>
              <label className="input-label">{input}</label>
              <textarea className="node-input" placeholder={`Enter ${input}`} />
            </div>
          ))}
        </div>
      )}

      {/* Show LLM Prompt if available */}
      {data.llm_prompt && (
        <div className="node-section">
          <strong>LLM Prompt:</strong>
          <textarea className="node-input" defaultValue={data.llm_prompt} />
        </div>
      )}

      {/* Show Validation Prompt if available */}
      {data.validation_prompt && (
        <div className="node-section">
          <strong>Validation Prompt:</strong>
          <textarea className="node-input" defaultValue={data.validation_prompt} />
        </div>
      )}

      {/* Input/Output Handles */}
      <Handle type="target" position="top" />
      <Handle type="source" position="bottom" />
    </div>
  );
};

export default CustomNode; 