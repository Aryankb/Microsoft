import React, { useState } from "react";
import { Handle } from "reactflow";
import { Tooltip } from "react-tooltip";
import "./CustomNode.css";
import { useAuth } from "@clerk/clerk-react";
// Import necessary icons
import {
  FileSpreadsheet,
  Mail,
  NotebookPen,
  Youtube,
  Linkedin,
  Calendar,
  FileText,
  FileIcon,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

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
  handleValueChange: (
    nodeId: string | number,
    field: string,
    value: string,
    type: string
  ) => void;
}

interface CustomNodeProps {
  data: CustomNodeData;
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const { handleValueChange } = data;
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const { getToken } = useAuth();

  // Add state to track text length categories
  const [textSizeCategory, setTextSizeCategory] = useState<{
    [key: string]: "small" | "medium" | "large";
  }>({});

  if (!handleValueChange) {
    console.error(`🚨 handleValueChange is missing for node ${data.id}`);
  }

  const handleInputChange = (key: string, value: string) => {
    console.log(`📝 Changing input for node ${data.id}: ${key} = ${value}`);
    data.handleValueChange(data.id, key, value, "config");
  };

  // Function to handle file upload and update config
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await getToken();
      const response = await fetch('http://localhost:8000/file_upload', {
        method: 'POST',
        headers: {Authorization:`Bearer ${token}`},
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { file_location_s3 } = await response.json();

      // Update the file_location_s3 config input using the parent's handleValueChange
      if (data.id && handleValueChange) {
        handleValueChange(data.id, file.name, file_location_s3, 'config');
      }

      // Ensure the config_inputs dictionary is updated with the new file name
      // if (data.config_inputs && handleValueChange) {
      //   handleValueChange(data.id, file.name, file_location_s3, 'config');
      // }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Function to determine text size category
  const getTextSizeCategory = (text: string): "small" | "medium" | "large" => {
    if (!text) return "small";
    const length = text.length;
    if (length < 100) return "small";
    if (length < 500) return "medium";
    return "large";
  };

  // Update size category when expanding a field
  const toggleTextareaExpand = (fieldName: string) => {
    if (expandedField === fieldName) {
      setExpandedField(null);
    } else {
      setExpandedField(fieldName);

      // Set size category based on content
      let content = "";
      if (fieldName === "llm_prompt") {
        content = data.llm_prompt || "";
      } else if (fieldName === "validation_prompt") {
        content = data.validation_prompt || "";
      } else if (fieldName.startsWith("config_")) {
        const key = fieldName.replace("config_", "");
        content = data.config_inputs?.[key] || "";
      }

      setTextSizeCategory((prev) => ({
        ...prev,
        [fieldName]: getTextSizeCategory(content),
      }));
    }
  };

  const nodeClass =
    data.type === "llm"
      ? "node-llm"
      : data.type === "connector"
      ? "node-connector"
      : "node-tool";

  // Function to render an icon based on label text
  const renderLabelWithIcon = () => {
    const label = data.label.toString().toUpperCase();

    if (label.includes("FILE_UPLOAD")) {
      return (
      <>
        <FileIcon size={30} className="mr-1" />
        <label className="file-upload-label">
        <input
          type="file"
          className="hidden-file-input"
          onChange={handleFileUpload}
        />
        <span>Upload File +</span>
        </label>
      </>
      );
    }

    // Map of tool names to their respective icons
    else if (label.includes("GOOGLESHEETS") || label.includes("GOOGLE SHEETS")) {
      return (
      <>
        <FileSpreadsheet size={30} className="mr-1" />
        <span>Sheets</span>
      </>
      );
    } else if (label.includes("GMAIL")) {
      return (
      <>
        <Mail size={30} className="mr-1" />
        <span>Gmail</span>
      </>
      );
    } else if (label.includes("NOTION")) {
      return (
      <>
        <NotebookPen size={30} className="mr-1" />
        <span>Notion</span>
      </>
      );
    } else if (label.includes("YOUTUBE")) {
      return (
      <>
        <Youtube size={30} className="mr-1" />
        <span>YouTube</span>
      </>
      );
    } else if (label.includes("LINKEDIN")) {
      return (
      <>
        <Linkedin size={30} className="mr-1" />
        <span>LinkedIn</span>
      </>
      );
    } else if (
      label.includes("GOOGLECALENDAR") ||
      label.includes("GOOGLE CALENDAR")
    ) {
      return (
      <>
        <Calendar size={30} className="mr-1" />
        <span>Calendar</span>
      </>
      );
    } else if (label.includes("GOOGLEDOCS") || label.includes("GOOGLE DOCS")) {
      return (
      <>
        <FileText size={30} className="mr-1" />
        <span>Docs</span>
      </>
      );
    } else if (label.includes("ITERATOR")) {
      return (
      <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-1"
      >
        <path d="M17 1v6h-6" />
        <path d="M7 23v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.36-4.36L17 7" />
        <path d="M20.49 15a9 9 0 0 1-14.36 4.36L7 17" />
      </svg>
        <span>Iterator</span>
      </>
      );
    } 
    else if (label.includes("VALIDATOR")) {
      return (
      <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-1"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span>Validator</span>
      </>
      );
    } else if (label.includes("DELEGATOR")) {
      return (
      <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-1"
      >
        <line x1="22" y1="12" x2="2" y2="12" />
        <polyline points="15 5 22 12 15 19" />
      </svg>
      <span>Delegator</span>
      </>
      );
    }
    else if (data.type === "llm") {
      return (
      <>
      
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-brain-icon lucide-brain"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>
      <span>AI : {data.label}</span>
      </>
      );
    }


    // Default: return the original label
    return data.label;
  };

  return (
    <div className={`custom-node ${nodeClass}`}>
      <div className="node-header">
        <div className="flex justify-between w-full">
          <span className="node-title">
            {/* {data.id} */}
            {typeof data.label === "string"
              ? renderLabelWithIcon()
              : data.label}
          </span>

          {/* Tooltip */}
          <span className="info-icon" data-tooltip-id={`tooltip-${data.id}`}>
            ℹ️
          </span>
          <Tooltip id={`tooltip-${data.id}`} place="top" effect="solid">
            <div>
              <strong>ID:</strong> {data.id}
            </div>
            <div>
              <strong>Type:</strong> {data.type}
            </div>
            <div>
              <strong>Description:</strong> {data.description}
            </div>
          </Tooltip>
        </div>

        {data.tool_action && (
            <span className="node-action">{data.tool_action.replace(/_/g, " ")}</span>
        )}
      </div>

      {/* Execution Mark */}
      {data.to_execute && (
        <div
          className={`execution-mark ${
            data.to_execute[1] === "Y" ? "green" : "red"
          }`}
        >
          {data.connectorName}
        </div>
      )}

      {/* Config Inputs */}
      {/* Object.keys(data.config_inputs).map((key) => (
              <div key={key} className="config-input-item">
          <span className="config-key">{key}</span>
              </div>
            )) */}
      {data.config_inputs && Object.keys(data.config_inputs).length > 0 && (
        <div className="node-section">
          {/* <strong>Config Inputs:</strong> */}
          {/* data.label==="FILE_UPLOAD" ? {Object.keys(data.config_inputs).map((key) => (
              <div key={key} className="config-input-item">
          <span className="config-key">{key}</span>
              </div>
            ))}: */}
          {Object.entries(data.config_inputs).map(([key, value]) => (
            <div key={key} className="config-input-item">
              <div className="field-header">
          <label className="input-label">{key}</label>
          <button
            className="expand-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTextareaExpand(`config_${key}`);
            }}
            title="Click to expand"
          >
            {expandedField === `config_${key}` ? (
              <Minimize2 size={14} />
            ) : (
              <Maximize2 size={14} />
            )}
          </button>
              </div>
              <div
          className={`textarea-container ${
            expandedField === `config_${key}`
              ? `expanded ${textSizeCategory[`config_${key}`] || "small"}`
              : ""
          }`}
              >
          {expandedField === `config_${key}` && (
            <div className="expanded-header">
              <span className="expanded-title">{key}</span>
              <button
                className="expanded-close"
                onClick={() => setExpandedField(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {data.label!=="file_upload" &&
          (<input
            type="text"
            className="node-input"
            placeholder="enter"
            defaultValue={value || ""}
            onChange={(e) => {
              console.log(`Config input changed: ${key} = ${e.target.value}`);
              handleInputChange(key, e.target.value);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!expandedField) toggleTextareaExpand(`config_${key}`);
            }}
          />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LLM Prompt */}
      {data.llm_prompt && (
        <div className="node-section">
          <div className="field-header">
            <strong>Prompt:</strong>
            <button
              className="expand-button"
              onClick={(e) => {
                e.stopPropagation();
                toggleTextareaExpand("llm_prompt");
              }}
              title="Click to expand"
            >
              {expandedField === "llm_prompt" ? (
                <Minimize2 size={14} />
              ) : (
                <Maximize2 size={14} />
              )}
            </button>
          </div>
          <div
            className={`textarea-container ${
              expandedField === "llm_prompt"
                ? `expanded ${textSizeCategory["llm_prompt"] || "medium"}`
                : ""
            }`}
          >
            {expandedField === "llm_prompt" && (
              <div className="expanded-header">
                <span className="expanded-title">LLM Prompt</span>
                <button
                  className="expanded-close"
                  onClick={() => setExpandedField(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <textarea
              className="node-input"
              defaultValue={data.llm_prompt || ""}
              onChange={(e) => {
                handleValueChange(data.id, "llm_prompt", e.target.value, "prompt");
                // Update size category as user types
                setTextSizeCategory((prev) => ({
                  ...prev,
                  ["llm_prompt"]: getTextSizeCategory(e.target.value),
                }));
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!expandedField) toggleTextareaExpand("llm_prompt");
              }}
            />
          </div>
        </div>
      )}

      {/* Validation Prompt */}
      {data.validation_prompt && (
        <div className="node-section">
          <div className="field-header">
            <strong>Prompt:</strong>
            <button
              className="expand-button"
              onClick={(e) => {
                e.stopPropagation();
                toggleTextareaExpand("validation_prompt");
              }}
              title="Click to expand"
            >
              {expandedField === "validation_prompt" ? (
                <Minimize2 size={14} />
              ) : (
                <Maximize2 size={14} />
              )}
            </button>
          </div>
          <div
            className={`textarea-container ${
              expandedField === "validation_prompt"
                ? `expanded ${
                    textSizeCategory["validation_prompt"] || "medium"
                  }`
                : ""
            }`}
          >
            {expandedField === "validation_prompt" && (
              <div className="expanded-header">
                <span className="expanded-title">Validation Prompt</span>
                <button
                  className="expanded-close"
                  onClick={() => setExpandedField(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <textarea
              className="node-input"
              defaultValue={data.validation_prompt}
              onChange={(e) => {
                handleValueChange(data.id, "validation_prompt", e.target.value, "prompt");
                // Update size category as user types
                setTextSizeCategory((prev) => ({
                  ...prev,
                  ["validation_prompt"]: getTextSizeCategory(e.target.value),
                }));
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!expandedField) toggleTextareaExpand("validation_prompt");
              }}
            />
          </div>
        </div>
      )}

      {/* Input/Output Handles */}
      <Handle type="target" position="top" />
      <Handle type="source" position="bottom" />
    </div>
  );
};

export default CustomNode;
