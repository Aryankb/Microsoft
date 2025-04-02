import { useRef, useState, useEffect } from "react";
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

  if (!refinedQuery) {
    return null;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md">
      <div
        className="px-5 py-3 rounded-lg bg-green-500 text-white cursor-pointer mb-4"
        onClick={(e) => {
          const input = e.currentTarget
            .nextElementSibling as HTMLTextAreaElement;
          input.style.display = "block";
          input.focus();
          e.currentTarget.style.display = "none";

          // Auto-resize the textarea when displayed
          autoResizeTextarea(input);
        }}
      >
        {refinedQuery}
      </div>

      <textarea
        ref={refinedQueryRef}
        value={refinedQuery}
        onBlur={(e) => {
          e.target.style.display = "none";
          e.target.previousElementSibling.style.display = "block";
          setRefinedQuery(e.target.value);
        }}
        onChange={(e) => {
          setRefinedQuery(e.target.value);
          // Auto-resize while typing
          autoResizeTextarea(e.target);
        }}
        onFocus={(e) => {
          // Ensure proper sizing when focused
          autoResizeTextarea(e.target);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const newValue = e.currentTarget.value + "\n";
            setRefinedQuery(newValue);

            // Let React update the value, then resize
            setTimeout(() => autoResizeTextarea(e.currentTarget), 0);
          }
        }}
        className="w-full px-4 py-3 border rounded-lg resize-none bg-gray-700 text-white mb-4"
        placeholder="Refined Query"
        style={{
          display: "none",
          minHeight: "80px", // Set minimum height
          overflowY: "hidden", // Hide scrollbar when auto-sizing
        }}
      />

      <div className="flex justify-between gap-4">
        <button
          onClick={() => {
            const userChoice = showWorkflow
              ? window.confirm("Cancel → create new\nOK → update existing")
              : false;
            handleGenerateWorkflow(userChoice);
          }}
          className="flex-1 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-all duration-200 text-center font-medium"
        >
          Generate Workflow
        </button>

        <button
          onClick={handleCopyText}
          className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
          title="Copy to clipboard"
        >
          {copySuccess ? (
            <>
              <Check size={16} className="text-green-400" />
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
