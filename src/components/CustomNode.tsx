// import React, { useState,useEffect } from "react";
// import { Handle,Position } from "reactflow";
// import { Tooltip } from "react-tooltip";
// import "./CustomNode.css";
// import { init } from "react-tooltip"; // 🔹 Fix tooltip issue

// interface CustomNodeData {
//   id: string | number;
//   label: string;
//   type: string;
//   tool_action?: string;
//   to_execute?: [string, string];
//   connectorName?: string;
//   description?: string;
//   config_inputs?: Record<string, string>; // Now a dictionary
//   llm_prompt?: string;
//   validation_prompt?: string;
//   delegation_prompt?: string;
// }

// interface CustomNodeProps {
//   id: string | number;
//   data: CustomNodeData;
//   onValueChange: (nodeId: string | number, field: string, value: string) => void;
// }

// const CustomNode: React.FC<CustomNodeProps> = ({ id,data,onValueChange }) => {
//   if (!onValueChange) {
//     console.error("onValueChange function is missing in CustomNode!");
//   }
//   // 🔹 Store config_inputs in local state for proper updates
//   const [inputValues, setInputValues] = useState<Record<string, string>>(data.config_inputs || {});

//   // 🔹 Ensure tooltip hover works
//   useEffect(() => {
//     init();
//   }, []);

//    // ✅ Function to update local input state
//    const handleInputChange = (key: string, value: string) => {
//     setInputValues((prevInputs) => ({ ...prevInputs, [key]: value }));
//   };

//   // ✅ Send updates to parent AFTER user stops typing (debounce effect)
//   useEffect(() => {
//     const delayDebounce = setTimeout(() => {
//       onValueChange(id, "config_inputs", inputValues);
//     }, 500); // 500ms delay before saving
//     return () => clearTimeout(delayDebounce);
//   }, [inputValues]); // Runs whenever inputValues change

//   return (
//     <div className={`custom-node ${data.type}`}>
//       <div className="node-header">
//         <span className="node-title">{data.id}.{data.label}</span>
//         {data.tool_action && <span className="node-action">({data.tool_action})</span>}

//         {/* Tooltip */}
//         <span className="info-icon" data-tooltip-id={`tooltip-${data.id}`}>
//           ℹ️
//         </span>
//         <Tooltip id={`tooltip-${data.id}`} place="top" effect="solid">
//           <div><strong>ID:</strong> {data.id}</div>
//           <div><strong>Type:</strong> {data.type}</div>
//           <div><strong>Description:</strong> {data.description}</div>
//         </Tooltip>
//       </div>

//       {/* ✅ Config Inputs (Editable) */}
//       {Object.entries(inputValues).map(([key, value]) => (
//         <div key={key}>
//           <label className="input-label">{key}</label>
//           <input
//             type="text"
//             className="node-input"
//             placeholder="enter"
//             value={value || ""}
//             onChange={(e) => handleInputChange(key, e.target.value)}
//           />
//         </div>
//       ))}

//       {/* 🔹 LLM Prompt */}
//       {data.llm_prompt && (
//         <div className="node-section">
//           <strong>LLM Prompt:</strong>
//           <textarea
//             className="node-input"
//             value={data.llm_prompt}
//             onChange={(e) => onValueChange(id, "llm_prompt", e.target.value)}
//           />
//         </div>
//       )}

//       {/* 🔹 Validation Prompt */}
//       {data.validation_prompt && (
//         <div className="node-section">
//           <strong>Validation Prompt:</strong>
//           <textarea
//             className="node-input"
//             value={data.validation_prompt}
//             onChange={(e) => onValueChange(id, "validation_prompt", e.target.value)}
//           />
//         </div>
//       )}

//       {/* 🔹 Delegation Prompt */}
//       {data.delegation_prompt && (
//         <div className="node-section">
//           <strong>Delegation Prompt:</strong>
//           <textarea
//             className="node-input"
//             value={data.delegation_prompt}
//             onChange={(e) => onValueChange(id, "delegation_prompt", e.target.value)}
//           />
//         </div>
//       )}

//       {/* Input/Output Handles */}
//       <Handle type="target" position={Position.Top} />
//       <Handle type="source" position={Position.Bottom} />
//     </div>
//   );
// };

// export default CustomNode;
import React, { useState } from "react";
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
  config_inputs?: Record<string, string>; // Now a dictionary
  llm_prompt?: string;
  validation_prompt?: string;
  delegation_prompt?: string;
  handleValueChange: (nodeId: string | number, field: string, value: string,type:string) => void;
}

interface CustomNodeProps {
  data: CustomNodeData;
}

const CustomNode: React.FC<CustomNodeProps> = ({ id,data}) => {
  
  const { handleValueChange } = data; 
  if (!handleValueChange) {
    console.error(`🚨 handleValueChange is missing for node ${id}`);
  }
  const handleInputChange = (key: string, value: string) => {
    console.log(`📝 Changing input for node ${id}: ${key} = ${value}`);
  
    // const updatedInputs = { ...(data.config_inputs || {}), [key]: value };
  
    // ✅ Update Parent State
    data.handleValueChange(id, key, value,"config");
  };
  const nodeClass =

    data.type === "llm" ? "node-llm" :
    data.type === "connector"  ? "node-connector" :
    "node-tool";

  // const [inputValues, setInputValues] = useState(data.config_inputs || {});

  // const handleInputChange = (key: string, value: string) => {
  //   setInputValues((prev) => ({ ...prev, [key]: value }));
  // };

  return (
    <div className={`custom-node ${nodeClass}`}>
      <div className="node-header">
        <span className="node-title">{data.id}.{data.label}</span>
        {data.tool_action && <span className="node-action">({data.tool_action})</span>}

        {/* Tooltip */}
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
        <div className={`execution-mark ${data.to_execute[1] === "Y" ? "green" : "red"}`}>
          {data.connectorName}
        </div>
      )}

      {/* Config Inputs */}
      {data.config_inputs && Object.keys(data.config_inputs).length > 0 && (
        <div className="node-section">
          <strong>Config Inputs:</strong>
          {Object.entries(data.config_inputs).map(([key, value]) => (
            <div key={key}>
              <label className="input-label">{key}</label>
              <input
                type="text"
                className="node-input"
                placeholder="enter"
                defaultValue={value || ""}
                onChange={(e) => handleInputChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* LLM Prompt */}
      {data.llm_prompt && (
        <div className="node-section">
          <strong>LLM Prompt:</strong>
          <textarea className="node-input" defaultValue={data.llm_prompt || ""} onChange={(e) => handleValueChange(id, "llm_prompt", e.target.value,"prompt")}/>
        </div>
      )}

      {/* Validation Prompt */}
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
