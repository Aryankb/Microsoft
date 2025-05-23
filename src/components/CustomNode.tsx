import React, { useState } from "react";
import { Handle } from "reactflow";
import "./CustomNode.css";
import { useAuth } from "@clerk/clerk-react";
import TextAreaModal from "./TextAreaModal";
// Import necessary icons
import {
  Maximize2,
} from "lucide-react";

interface CustomNodeData {
  id: string | number;
  label: string;
  type: string;
  tool_action?: string;
  to_execute?: [string, string];
  connectorName?: string;
  description?: string;
  config_inputs?: Record<string, string>;
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

interface ModalContent {
  title: string;
  value: string;
  isTextArea: boolean;
  fieldName: string;
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const { handleValueChange } = data;
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<ModalContent>({
    title: "",
    value: "",
    isTextArea: true,
    fieldName: "",
  });
  const { getToken } = useAuth();

  // const [textSizeCategory, setTextSizeCategory] = useState<{
  //   [key: string]: "small" | "medium" | "large";
  // }>({});

  if (!handleValueChange) {
    console.error(`🚨 handleValueChange is missing for node ${data.id}`);
  }

  const handleInputChange = (key: string, value: string) => {
    console.log(`📝 Changing input for node ${data.id}: ${key} = ${value}`);
    data.handleValueChange(data.id, key, value, "config");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = await getToken();
      const response = await fetch("https://backend.sigmoyd.in/file_upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { file_location } = await response.json();
      console.log("File uploaded successfully:", file_location);

      if (data.id && handleValueChange) {
        handleValueChange(data.id, file.name, file_location, "config");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleFileDelete = async (fileLocation: string) => {
    if (!fileLocation) return;

    try {
      const token = await getToken();
      const response = await fetch("https://backend.sigmoyd.in/file_delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ file_location: fileLocation }),
      });
      if (!response.ok) {
        throw new Error("Delete failed");
      }
      if (data.id && handleValueChange && data.config_inputs) {
        const fileKey = Object.entries(data.config_inputs).find(
          ([_, value]) => value === fileLocation
        )?.[0];

        if (fileKey) {
          const newConfigInputs: Record<string, string> = {};

          Object.entries(data.config_inputs).forEach(([key, value]) => {
            if (key !== fileKey) {
              newConfigInputs[key] = value;
            }
          });

          handleValueChange(
            data.id,
            "_replace_all_config_inputs_",
            JSON.stringify(newConfigInputs),
            "config"
          );
        }
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // const getTextSizeCategory = (text: string): "small" | "medium" | "large" => {
  //   if (!text) return "small";
  //   const length = text.length;
  //   if (length < 100) return "small";
  //   if (length < 500) return "medium";
  //   return "large";
  // };

  const toggleTextareaExpand = (fieldName: string) => {
    let content = "";
    let title = "";
    let isTextArea = true;

    if (fieldName === "llm_prompt") {
      content = data.llm_prompt || "";
      title = "LLM Prompt";
      isTextArea = true;
    } else if (fieldName === "validation_prompt") {
      content = data.validation_prompt || "";
      title = "Validation Prompt";
      isTextArea = true;
    } else if (fieldName.startsWith("config_")) {
      const key = fieldName.replace("config_", "");
      content = data.config_inputs?.[key] || "";
      title = key;
      isTextArea = false;
    }

    setModalContent({
      title,
      value: content,
      isTextArea,
      fieldName,
    });
    setExpandedField(fieldName);
  };

  const handleModalClose = () => {
    setExpandedField(null);
  };

  const handleModalChange = (value: string) => {
    const { fieldName } = modalContent;
    
    if (fieldName === "llm_prompt") {
      handleValueChange(data.id, "llm_prompt", value, "prompt");
    } else if (fieldName === "validation_prompt") {
      handleValueChange(data.id, "validation_prompt", value, "prompt");
    } else if (fieldName.startsWith("config_")) {
      const key = fieldName.replace("config_", "");
      handleInputChange(key, value);
    }
    
    setModalContent(prev => ({ ...prev, value }));
  };

  // const renderLabelWithIcon = () => {
  //   const label = data.label.toString().toUpperCase();

  //   if (label.includes("FILE_UPLOAD")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <FileIcon size={24} className="node-icon" />
  //         <span>File Upload</span>
  //       </div>
  //     );
  //   } else if (label.includes("GOOGLESHEETS") || label.includes("GOOGLE SHEETS")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <FileSpreadsheet size={24} className="node-icon sheets" />
  //         <span>Sheets</span>
  //       </div>
  //     );
  //   } else if (label.includes("GMAIL")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <Mail size={24} className="node-icon gmail" />
  //         <span>Gmail</span>
  //       </div>
  //     );
  //   } else if (label.includes("NOTION")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <NotebookPen size={24} className="node-icon notion" />
  //         <span>Notion</span>
  //       </div>
  //     );
  //   } else if (label.includes("YOUTUBE")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <Youtube size={24} className="node-icon youtube" />
  //         <span>YouTube</span>
  //       </div>
  //     );
  //   } else if (label.includes("LINKEDIN")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <Linkedin size={24} className="node-icon linkedin" />
  //         <span>LinkedIn</span>
  //       </div>
  //     );
  //   } else if (label.includes("GOOGLECALENDAR") || label.includes("GOOGLE CALENDAR")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <Calendar size={24} className="node-icon calendar" />
  //         <span>Calendar</span>
  //       </div>
  //     );
  //   } else if (label.includes("GOOGLEDOCS") || label.includes("GOOGLE DOCS")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <FileText size={24} className="node-icon docs" />
  //         <span>Docs</span>
  //       </div>
  //     );
  //   } else if (label.includes("GOOGLEMEET") || label.includes("GOOGLE MEET")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <AlarmCheck size={24} className="node-icon meet" />
  //         <span>Google Meet</span>
  //       </div>
  //     );
  //   } else if (label.includes("ITERATOR")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <IterationCcw size={24} className="node-icon iterator" />
  //         <span>Iterator</span>
  //       </div>
  //     );
  //   } else if (label.includes("VALIDATOR")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <CheckSquare size={24} className="node-icon validator" />
  //         <span>Validator</span>
  //       </div>
  //     );
  //   } else if (label.includes("DELEGATOR")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <Send size={24} className="node-icon delegator" />
  //         <span>Delegator</span>
  //       </div>
  //     );
  //   } else if (label.includes("GEMINI")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <Sparkles size={24} className="node-icon gemini" />
  //         <span>Gemini</span>
  //       </div>
  //     );
  //   } else if (label.includes("API") || label.includes("CODE")) {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <Code size={24} className="node-icon code" />
  //         <span>Code</span>
  //       </div>
  //     );
  //   } else if (data.type === "llm") {
  //     return (
  //       <div className="node-icon-wrapper">
  //         <BrainCircuit size={24} className="node-icon llm" />
  //         <span>{data.label}</span>
  //       </div>
  //     );
  //   }

  //   return <span>{data.label}</span>;
  // };

  const getNodeClass = () => {
    let baseClass = "custom-node";
    
    if (data.type === "llm") {
      baseClass += " node-llm";
    } else if (data.type === "connector") {
      baseClass += " node-connector";
    } else if (data.type === "tool") {
      baseClass += " node-tool";
    }

    if (data.label) {
      const label = data.label.toString().toUpperCase();
      if (label.includes("GMAIL")) {
        baseClass += " gmail-node";
      } else if (label.includes("NOTION")) {
        baseClass += " notion-node";
      } else if (label.includes("ITERATOR")) {
        baseClass += " iterator-node";
      } else if (label.includes("VALIDATOR")) {
        baseClass += " validator-node"; 
      } else if (label.includes("GEMINI")) {
        baseClass += " gemini-node";
      }
    }
    
    return baseClass;
  };

  const isIconNodeType = () => {
    const label = data.label?.toString().toUpperCase() || '';
    return data.type === "tool" || 
           data.type === "llm" || 
           (data.type === "connector" && 
             (label.includes("VALIDATOR") || 
              label.includes("ITERATOR") || 
              label.includes("DELEGATOR")));
  };

  const renderExecutionMark = () => {
    if (!data.to_execute) return null;
    
    const label = data.label?.toString().toUpperCase() || '';
    const isIconNodeType = 
      data.type === "tool" || 
      data.type === "llm" || 
      (data.type === "connector" && 
        (label.includes("VALIDATOR") || 
         label.includes("ITERATOR") || 
         label.includes("DELEGATOR")));
    
    if (isIconNodeType) return null;
   
    return (
      <div
        className={`execution-mark ${
          data.to_execute[1] === "A" ? "green" : 
      data.to_execute[1] === "B" ? "blue" :
      data.to_execute[1] === "C" ? "orange" :
      data.to_execute[1] === "D" ? "purple" :
      data.to_execute[1] === "E" ? "red" :
      data.to_execute[1] === "F" ? "yellow" :
      data.to_execute[1] === "G" ? "pink" :
      data.to_execute[1] === "H" ? "turquoise" :
      data.to_execute[1] === "I" ? "lavender" :
      data.to_execute[1] === "J" ? "cyan" :
      data.to_execute[1] === "K" ? "magenta" :
      data.to_execute[1] === "L" ? "teal" :
      data.to_execute[1] === "M" ? "indigo" :
      data.to_execute[1] === "N" ? "olive" :
      data.to_execute[1] === "O" ? "maroon" :
      data.to_execute[1] === "P" ? "gold" :
      data.to_execute[1] === "Q" ? "navy" :
      data.to_execute[1] === "R" ? "coral" :
      data.to_execute[1] === "S" ? "lime" :
      data.to_execute[1] === "T" ? "crimson" :
      data.to_execute[1] === "U" ? "skyblue" :
      data.to_execute[1] === "V" ? "salmon" :
      data.to_execute[1] === "W" ? "tan" :
      data.to_execute[1] === "X" ? "steelblue" :
      data.to_execute[1] === "Y" ? "sienna" :
      data.to_execute[1] === "Z" ? "chocolate" : "gray"
        }`}
      >
        Val-{data.connectorName}: {data.to_execute[1]}
      </div>
    );
  };

  return (
    <div 
      className={`${getNodeClass()} ${isIconNodeType() ? 'with-icon-node' : ''}`}
      onClick={(e) => {
        // Stop propagation only if this node has editable content
        if (data.config_inputs?.length > 0 || data.llm_prompt || data.validation_prompt) {
          e.stopPropagation();
        }
      }}
    >
      {/* Simplified node identifier */}
      <div className="node-identifier">
        <div className="node-id-badge" data-tooltip-id={`tooltip-${data.id}`}>{data.id}</div>
        {!isIconNodeType() && (
          <div className="node-title-mini">
            {typeof data.label === "string" && data.label.split("_").pop()}
          </div>
        )}
        {/* <Tooltip id={`tooltip-${data.id}`} place="top" effect="solid">
          <div>
            <strong>ID:</strong> {data.id}
          </div>
          <div>
            <strong>Type:</strong> {data.type}
          </div>
          <div>
            <strong>Name:</strong> {data.label}
          </div>
          {data.description && (
            <div>
              <strong>Description:</strong> {data.description}
            </div>
          )}
        </Tooltip> */}
      </div>

      {/* Tool action tag if present */}
      {data.tool_action && !isIconNodeType() && (
        <span className="node-action-tag">
          {data.tool_action.replace(/_/g, " ")}
        </span>
      )}

      {renderExecutionMark()}

      {/* Add file upload button for FILE_UPLOAD nodes */}
      {data.label && data.label.toString().toUpperCase().includes("FILE_UPLOAD") && (
        <div className="node-section upload-section">
          <label className="upload-button" htmlFor={`file-upload-${data.id}`}>
            Upload File
          </label>
          <input
            id={`file-upload-${data.id}`}
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {data.config_inputs && Object.keys(data.config_inputs).length > 0 && (
        <div className="node-section">
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
                  <Maximize2 size={14} />
                </button>
              </div>
              <div 
                className="input-preview"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTextareaExpand(`config_${key}`);
                }}
              >
                {value ? String(value).substring(0, 25) + (String(value).length > 25 ? "..." : "") : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.label &&
        data.label.toString().toUpperCase().includes("FILE_UPLOAD") &&
        data.config_inputs &&
        Object.keys(data.config_inputs).length > 0 && (
          <div className="node-section file-list-section">
            <div className="uploaded-files-header">Uploaded Files:</div>
            {Object.entries(data.config_inputs)
              .filter(([_, value]) => value && value.trim() !== "")
              .map(([key, value]) => (
                <div key={key} className="uploaded-file-item">
                  <div className="file-info">
                    <span className="file-name" title={key}>
                      {key}
                    </span>
                  </div>
                  <button
                    className="file-delete-button"
                    onClick={() => handleFileDelete(value)}
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>
        )}

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
              <Maximize2 size={14} />
            </button>
          </div>
          <div 
            className="input-preview prompt-preview"
            onClick={(e) => {
              e.stopPropagation();
              toggleTextareaExpand("llm_prompt");
            }}
          >
            {data.llm_prompt.substring(0, 40) + (data.llm_prompt.length > 40 ? "..." : "")}
          </div>
        </div>
      )}

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
              <Maximize2 size={14} />
            </button>
          </div>
          <div 
            className="input-preview prompt-preview"
            onClick={(e) => {
              e.stopPropagation();
              toggleTextareaExpand("validation_prompt");
            }}
          >
            {data.validation_prompt.substring(0, 40) + 
              (data.validation_prompt.length > 40 ? "..." : "")}
          </div>
        </div>
      )}

      <TextAreaModal
        isOpen={expandedField !== null}
        onClose={handleModalClose}
        title={modalContent.title}
        value={modalContent.value}
        onChange={handleModalChange}
        isTextArea={modalContent.isTextArea}
      />

      <Handle type="target" position="top" className="target-handle" />
      <Handle type="source" position="bottom" className="source-handle" />
    </div>
  );
};

export default CustomNode;
