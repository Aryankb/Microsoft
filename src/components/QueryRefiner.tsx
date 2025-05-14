import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";

interface QueryRefinerProps {
  refinedQuery: string | null;
  setRefinedQuery: (query: string) => void;
  handleGenerateWorkflow: (isUpdate: boolean) => void;
  showWorkflow: boolean;
}

const QueryRefiner = ({
  refinedQuery,
  setRefinedQuery,
  handleGenerateWorkflow,
  showWorkflow,
}: QueryRefinerProps) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const refinedQueryRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Function to auto-resize textarea based on content
  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    if (!element) return;

    // Reset height to measure content properly
    element.style.height = "auto";

    // Set height to scroll height to display all content, with a minimum height
    const minHeight = 80; // Set minimum height in pixels
    element.style.height = `${Math.max(element.scrollHeight, minHeight)}px`;
  };

  // Function to handle copy to clipboard
  const handleCopyText = () => {
    if (refinedQuery) {
      navigator.clipboard
        .writeText(refinedQuery)
        .then(() => {
          // Show success state temporarily
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (refinedQueryRef.current) {
        refinedQueryRef.current.focus();
        autoResizeTextarea(refinedQueryRef.current);
      }
    }, 0);
  };

  const handleEndEditing = () => {
    setIsEditing(false);
  };

  const handleStartGeneratingWorkflow = () => {
    // Validate that there's content to generate from
    if (!refinedQuery || refinedQuery.trim() === '') {
      alert("Cannot generate workflow: No query content available.");
      return;
    }
    
    // If showing workflow already, confirm if user wants to update or create new
    const userChoice = showWorkflow
      ? window.confirm("Cancel → create new\nOK → update existing")
      : false;
    
    // Call the parent's handleGenerateWorkflow with the user's choice
    handleGenerateWorkflow(userChoice);
  };

  if (!refinedQuery) {
    return null;
  }

  return (
    <div className="query-refiner">
      {/* Improved edit prompt above the query display */}
      {!isEditing && (
        <div className="flex items-center justify-between mb-2">
          <div className="refined-query">
              <span className="refined-query-header">
                I've refined your query:
              </span>
            </div>
          <div className="text-text-accent text-xs flex items-center bg-card bg-opacity-50 px-2 py-1 rounded-md">
            <span className="mr-1">✏️</span>
            <span>Click query below to edit</span>
          </div>
          
        </div>
      )}

      {!isEditing ? (
        <div
          className="query-display"
          onClick={handleStartEditing}
          title="Click to edit query"
        >
          {refinedQuery}
        </div>
      ) : (
        <textarea
          ref={refinedQueryRef}
          value={refinedQuery}
          onChange={(e) => {
            setRefinedQuery(e.target.value);
            autoResizeTextarea(e.target);
          }}
          onBlur={handleEndEditing}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const newValue = e.currentTarget.value + "\n";
              setRefinedQuery(newValue);
              setTimeout(() => autoResizeTextarea(e.currentTarget), 0);
            }
          }}
          className="query-editor"
          placeholder="Refined Query"
        />
      )}

      <div className="query-actions">
        <div
          onClick={handleStartGeneratingWorkflow}
          className="generate-button"
        >
          Generate Workflow
        </div>

        <button
          onClick={handleCopyText}
          className="copy-button"
          title="Copy to clipboard"
        >
          {copySuccess ? (
            <>
              <Check size={16} className="success-icon" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QueryRefiner;
