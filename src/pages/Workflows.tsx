import { useState } from "react";
import QueryRefiner from "../components/QueryRefiner";
import WorkflowGraph from "../components/WorkflowGraph.tsx";
import PromptGenerator from "../components/PromptGenerator";

export default function Workflows() {
  const [fullScreenWorkflow, setFullScreenWorkflow] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [workflowJson, setWorkflowJson] = useState(null);
  const [refinedQuery, setRefinedQuery] = useState("");
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [isPromptGeneratorOpen, setIsPromptGeneratorOpen] = useState(false);

  const handleGenerateWorkflow = async (type = false) => {
    // Add actual workflow generation logic here
    console.log("Generating workflow with query:", refinedQuery);
    alert("Workflow generation would happen here with query: " + refinedQuery);
    // This would typically make an API call and then:
    // setWorkflowJson(response.data);
    // setShowWorkflow(true);
  };

  const updateWorkflow = (update) => {
    if (update.refinedQuery !== undefined) setRefinedQuery(update.refinedQuery);
    if (update.currentWorkflowId !== undefined)
      setCurrentWorkflow(update.currentWorkflowId);
  };

  const handleRegenerateWorkflow = (prompt, type = false) => {
    setRefinedQuery(prompt);
    handleGenerateWorkflow(type);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] relative">
      <PromptGenerator
        isOpen={isPromptGeneratorOpen}
        onToggle={() => setIsPromptGeneratorOpen(!isPromptGeneratorOpen)}
        onPromptGenerated={(prompt) => setRefinedQuery(prompt)}
        onRegenerateWorkflow={handleRegenerateWorkflow}
        currentWorkflowData={workflowJson}
        originalPrompt={refinedQuery}
        workflowUnavailable={workflowJson?.unavailable}
        showWorkflow={showWorkflow}
      />

      <main className="flex flex-1 pt-16 pb-24 relative">
        <div
          className={`flex flex-col transition-all duration-500 ease-in-out ${
            showWorkflow
              ? fullScreenWorkflow
                ? "w-0 opacity-0"
                : "w-1/3 bg-[var(--color-background)] z-10"
              : "w-full max-w-4xl mx-auto"
          } px-4 pt-4 overflow-y-auto min-h-full`}
        >
          {refinedQuery && !fullScreenWorkflow && (
            <div className="my-4">
              <QueryRefiner
                refinedQuery={refinedQuery}
                setRefinedQuery={(query) => updateWorkflow({ refinedQuery: query })}
                handleGenerateWorkflow={handleGenerateWorkflow}
                showWorkflow={showWorkflow}
              />
            </div>
          )}

          {workflowJson?.unavailable && (
            <div className="ai-reply-box my-4 p-4 bg-gray-800 text-white rounded-md">
              <p>{workflowJson.unavailable}</p>
              <div className="ai-reply-box my-4 p-4 bg-gray-800 text-white rounded-md">
                <p>
                  THE GENERATED WORKFLOW MIGHT NOT WORK BECAUSE OF
                  UNAVAILABILITY
                </p>
              </div>
            </div>
          )}
        </div>

        {showWorkflow && workflowJson && (
          <div
            className={`transition-all duration-500 ease-in-out ${
              fullScreenWorkflow
                ? "w-full fixed left-0 right-0 top-0 bottom-0 z-0 pt-16"
                : "w-2/3 fixed right-0 top-0 bottom-0 z-0 pt-16"
            } pb-8 px-3 mx-auto`}
          >
            <div className="absolute top-20 right-4 z-10 flex items-center">
              <button
                onClick={() => {
                  if (workflowJson && workflowJson.workflow_id) {
                    const url = `${window.location.origin}/workflow/${workflowJson.workflow_id}`;
                    navigator.clipboard.writeText(url);
                    alert("Workflow URL copied to clipboard!");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md shadow text-sm font-medium flex items-center"
                title="Copy shareable link"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1.5"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Share Workflow
              </button>
            </div>

            <button
              onClick={() => setFullScreenWorkflow(!fullScreenWorkflow)}
              className="workflow-toggle-button"
              title={
                fullScreenWorkflow ? "Show Query Panel" : "Hide Query Panel"
              }
            >
              <div className="workflow-toggle-icon">
                {fullScreenWorkflow ? ">>" : "<<"}
              </div>
              <span className="workflow-toggle-text">
                {fullScreenWorkflow ? "Show" : "Hide"}
              </span>
            </button>

            <WorkflowGraph
              key={JSON.stringify(workflowJson)}
              workflowJson={workflowJson}
              workflows={workflows}
              setWorkflows={setWorkflows}
              setCurrentWorkflow={(id) =>
                updateWorkflow({ currentWorkflowId: id })
              }
              currentWorkflow={currentWorkflow}
            />
          </div>
        )}
      </main>
    </div>
  );
}