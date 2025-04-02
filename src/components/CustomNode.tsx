import React, { useState } from "react";
import { Handle } from "reactflow";
import { Tooltip } from "react-tooltip";
import "./CustomNode.css";
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

const CustomNode: React.FC<CustomNodeProps> = ({ id, data }) => {
  const { handleValueChange } = data;
  const [expandedField, setExpandedField] = useState<string | null>(null);

  // Add state to track text length categories
  const [textSizeCategory, setTextSizeCategory] = useState<{
    [key: string]: "small" | "medium" | "large";
  }>({});

  if (!handleValueChange) {
    console.error(`🚨 handleValueChange is missing for node ${id}`);
  }

  const handleInputChange = (key: string, value: string) => {
    console.log(`📝 Changing input for node ${id}: ${key} = ${value}`);
    data.handleValueChange(id, key, value, "config");
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

    // Map of tool names to their respective icons
    if (label.includes("GOOGLESHEETS") || label.includes("GOOGLE SHEETS")) {
      return (
        <>
          <FileSpreadsheet size={16} className="mr-1" />
          <span>Sheets</span>
        </>
      );
    } else if (label.includes("GMAIL")) {
      return (
        <>
          <Mail size={16} className="mr-1" />
          <span>Gmail</span>
        </>
      );
    } else if (label.includes("NOTION")) {
      return (
        <>
          <NotebookPen size={16} className="mr-1" />
          <span>Notion</span>
        </>
      );
    } else if (label.includes("YOUTUBE")) {
      return (
        <>
          <Youtube size={16} className="mr-1" />
          <span>YouTube</span>
        </>
      );
    } else if (label.includes("LINKEDIN")) {
      return (
        <>
          <Linkedin size={16} className="mr-1" />
          <span>LinkedIn</span>
        </>
      );
    } else if (
      label.includes("GOOGLECALENDAR") ||
      label.includes("GOOGLE CALENDAR")
    ) {
      return (
        <>
          <Calendar size={16} className="mr-1" />
          <span>Calendar</span>
        </>
      );
    } else if (label.includes("GOOGLEDOCS") || label.includes("GOOGLE DOCS")) {
      return (
        <>
          <FileText size={16} className="mr-1" />
          <span>Docs</span>
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
            {data.id}.
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
          <span className="node-action">{data.tool_action}</span>
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
      {data.config_inputs && Object.keys(data.config_inputs).length > 0 && (
        <div className="node-section">
          <strong>Config Inputs:</strong>
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
                <input
                  type="text"
                  className="node-input"
                  placeholder="enter"
                  defaultValue={value || ""}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!expandedField) toggleTextareaExpand(`config_${key}`);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LLM Prompt */}
      {data.llm_prompt && (
        <div className="node-section">
          <div className="field-header">
            <strong>LLM Prompt:</strong>
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
                handleValueChange(id, "llm_prompt", e.target.value, "prompt");
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
            <strong>Validation Prompt:</strong>
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
