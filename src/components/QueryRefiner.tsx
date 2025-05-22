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

  // Helper function to format text with asterisks
  const formatText = (text: string) => {
    // Split by lines to handle each line separately
    const lines = text.split("\n");

    return (
      <div className="formatted-text">
        {lines.map((line, lineIndex) => {
          // Check if line is a bullet point
          if (line.trim().startsWith("*")) {
            // Determine indentation level (number of spaces at beginning)
            const indentLevel = line.search(/\S|$/) / 4;

            // Remove asterisk and extract the content
            let content = line.trim().substring(1).trim();

            // Handle bold text within the line (text between ** **)
            const boldPattern = /\*\*(.*?)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;

            while ((match = boldPattern.exec(content)) !== null) {
              // Add text before the bold part
              if (match.index > lastIndex) {
                parts.push(
                  <span key={`${lineIndex}-text-${lastIndex}`}>
                    {content.substring(lastIndex, match.index)}
                  </span>
                );
              }

              // Add the bold part
              parts.push(
                <span
                  key={`${lineIndex}-bold-${match.index}`}
                  className="font-bold text-blue-300"
                >
                  {match[1]}
                </span>
              );

              lastIndex = match.index + match[0].length;
            }

            // Add any remaining text
            if (lastIndex < content.length) {
              parts.push(
                <span key={`${lineIndex}-text-end`}>
                  {content.substring(lastIndex)}
                </span>
              );
            }

            return (
              <div
                key={lineIndex}
                className="flex"
                style={{
                  marginLeft: `${indentLevel * 1.5}rem`,
                  marginBottom: "0.5rem",
                }}
              >
                <span className="text-blue-400 mr-2">•</span>
                <div>{parts}</div>
              </div>
            );
          }

          // For non-bullet lines
          return line.trim() ? (
            <div key={lineIndex} className="mb-2">
              {line}
            </div>
          ) : (
            <div key={lineIndex} className="h-2"></div>
          );
        })}
      </div>
    );
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
          {formatText(refinedQuery)}
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
          onClick={() => {
            const userChoice = showWorkflow
              ? window.confirm("Cancel → create new\nOK → update existing")
              : false;
            handleGenerateWorkflow(userChoice);
          }}
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
