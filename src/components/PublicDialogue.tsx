import React, { useState, useEffect } from "react";
import { X, ArrowRight, Check, AlertCircle, Copy } from "lucide-react";

interface PublicDialogueProps {
  isOpen: boolean;
  onClose: () => void;
  workflowJson: any;
  onConfirm: (publicWorkflow: any) => void;
}

const PublicDialogue: React.FC<PublicDialogueProps> = ({
  isOpen,
  onClose,
  workflowJson,
  onConfirm,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [publicWorkflow, setPublicWorkflow] = useState<any>(null);
  const [editableNodes, setEditableNodes] = useState<any[]>([]);
  const [isConfirmView, setIsConfirmView] = useState(false);
  const [allConfigInputs, setAllConfigInputs] = useState<{
    [key: string]: any;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Initialize the component when a workflow is provided
  useEffect(() => {
    if (workflowJson) {
      // Create a deep copy of the workflow JSON
      const workflowCopy = JSON.parse(JSON.stringify(workflowJson));
      setPublicWorkflow(workflowCopy);

      // Find nodes that have config inputs or prompts
      const nodesWithInputs = workflowCopy.workflow.filter(
        (node: any) =>
          (node.config_inputs && Object.keys(node.config_inputs).length > 0) ||
          node.llm_prompt ||
          node.validation_prompt ||
          node.delegation_prompt
      );

      // Add trigger if it has config inputs
      if (
        workflowCopy.trigger &&
        workflowCopy.trigger.config_inputs &&
        Object.keys(workflowCopy.trigger.config_inputs).length > 0
      ) {
        nodesWithInputs.unshift({
          ...workflowCopy.trigger,
          isTrigger: true,
        });
      }

      setEditableNodes(nodesWithInputs);

      // Initialize all config inputs for summary view
      const allInputs: { [key: string]: any } = {};
      nodesWithInputs.forEach((node: any) => {
        const nodeId = node.isTrigger ? "trigger" : node.id;
        const nodeName = node.isTrigger
          ? node.name
          : `Node ${node.id}: ${node.name}`;

        allInputs[nodeId] = {
          name: nodeName,
          config_inputs: node.config_inputs || {},
          llm_prompt: node.llm_prompt || "",
          validation_prompt: node.validation_prompt || "",
          delegation_prompt: node.delegation_prompt || "",
        };
      });
      setAllConfigInputs(allInputs);
    }
  }, [workflowJson]);

  // Handler for updating node config inputs
  const handleConfigInputChange = (key: string, value: string) => {
    const currentNode = editableNodes[currentStep];

    if (currentNode.isTrigger) {
      // Update trigger config inputs
      setPublicWorkflow((prev: any) => {
        const updatedTrigger = {
          ...prev.trigger,
          config_inputs: {
            ...prev.trigger.config_inputs,
            [key]: value,
          },
        };
        return { ...prev, trigger: updatedTrigger };
      });

      // Update all config inputs for summary view
      setAllConfigInputs((prev: any) => ({
        ...prev,
        trigger: {
          ...prev.trigger,
          config_inputs: {
            ...prev.trigger.config_inputs,
            [key]: value,
          },
        },
      }));
    } else {
      // Update workflow node config inputs
      setPublicWorkflow((prev: any) => {
        const updatedWorkflow = prev.workflow.map((node: any) =>
          node.id === currentNode.id
            ? {
                ...node,
                config_inputs: {
                  ...node.config_inputs,
                  [key]: value,
                },
              }
            : node
        );
        return { ...prev, workflow: updatedWorkflow };
      });

      // Update all config inputs for summary view
      setAllConfigInputs((prev: any) => ({
        ...prev,
        [currentNode.id]: {
          ...prev[currentNode.id],
          config_inputs: {
            ...prev[currentNode.id].config_inputs,
            [key]: value,
          },
        },
      }));
    }
  };

  // Handler for updating node prompts
  const handlePromptChange = (type: string, value: string) => {
    const currentNode = editableNodes[currentStep];

    if (currentNode.isTrigger) {
      // Update trigger prompt
      setPublicWorkflow((prev: any) => {
        const updatedTrigger = { ...prev.trigger, [type]: value };
        return { ...prev, trigger: updatedTrigger };
      });

      // Update all config inputs for summary view
      setAllConfigInputs((prev: any) => ({
        ...prev,
        trigger: {
          ...prev.trigger,
          [type]: value,
        },
      }));
    } else {
      // Update workflow node prompt
      setPublicWorkflow((prev: any) => {
        const updatedWorkflow = prev.workflow.map((node: any) =>
          node.id === currentNode.id ? { ...node, [type]: value } : node
        );
        return { ...prev, workflow: updatedWorkflow };
      });

      // Update all config inputs for summary view
      setAllConfigInputs((prev: any) => ({
        ...prev,
        [currentNode.id]: {
          ...prev[currentNode.id],
          [type]: value,
        },
      }));
    }
  };

  // Handler for going to the next node
  const handleNext = () => {
    if (currentStep < editableNodes.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsConfirmView(true);
    }
  };

  // Handler for going back to the previous node
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handler for confirming the public workflow
  const handleConfirm = async () => {
    // Mark the workflow as public
    const finalWorkflow = {
      ...publicWorkflow,
      public: true,
    };

    setIsSubmitting(true);

    try {
      await onConfirm(finalWorkflow);

      // Show success state
      setIsPublished(true);
      setPublicUrl(
        `${window.location.origin}/public/workflow/${finalWorkflow.workflow_id}`
      );
    } catch (error) {
      console.error("Error making workflow public:", error);
      alert("Failed to make workflow public. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !publicWorkflow) return null;

  // Current node to edit
  const currentNode = isConfirmView ? null : editableNodes[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto z-50 p-4 flex justify-center items-start">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Dialog header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-text">
            {isConfirmView
              ? "Confirm Public Workflow"
              : `Configure Public View (${currentStep + 1}/${
                  editableNodes.length
                })`}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Dialog content */}
        <div className="p-6">
          {isConfirmView ? (
            // Confirmation view - shows all nodes and their config
            <div className="space-y-6">
              <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <div className="flex items-center mb-2">
                  <AlertCircle size={20} className="text-yellow-500 mr-2" />
                  <span className="font-medium">Important Notice</span>
                </div>
                <p className="text-gray-300">
                  This workflow will be made public with the configurations
                  shown below. Public workflows can be viewed and used by other
                  users. Make sure all sensitive information has been removed or
                  redacted.
                </p>
              </div>

              <h3 className="text-lg font-medium text-text-secondary mb-4">
                Summary of Configurations
              </h3>

              {Object.entries(allConfigInputs).map(
                ([nodeId, nodeData]: [string, any]) => (
                  <div
                    key={nodeId}
                    className="border border-gray-700 rounded-lg p-4 mb-4"
                  >
                    <h4 className="font-medium text-text-secondary mb-2">
                      {nodeData.name}
                    </h4>

                    {/* Config Inputs */}
                    {Object.keys(nodeData.config_inputs).length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm text-gray-400 mb-2">
                          Config Inputs:
                        </h5>
                        <div className="bg-background rounded p-2">
                          {Object.entries(nodeData.config_inputs).map(
                            ([key, value]: [string, any]) => (
                              <div
                                key={key}
                                className="flex justify-between mb-1 border-b border-gray-700 pb-1"
                              >
                                <span className="font-mono text-sm">
                                  {key}:
                                </span>
                                <span className="font-mono text-sm text-green-400">
                                  {String(value)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* LLM Prompt */}
                    {nodeData.llm_prompt && (
                      <div className="mb-4">
                        <h5 className="text-sm text-gray-400 mb-2">
                          LLM Prompt:
                        </h5>
                        <div className="bg-background rounded p-2">
                          <p className="text-sm font-mono whitespace-pre-wrap">
                            {nodeData.llm_prompt}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Validation Prompt */}
                    {nodeData.validation_prompt && (
                      <div className="mb-4">
                        <h5 className="text-sm text-gray-400 mb-2">
                          Validation Prompt:
                        </h5>
                        <div className="bg-background rounded p-2">
                          <p className="text-sm font-mono whitespace-pre-wrap">
                            {nodeData.validation_prompt}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Delegation Prompt */}
                    {nodeData.delegation_prompt && (
                      <div>
                        <h5 className="text-sm text-gray-400 mb-2">
                          Delegation Prompt:
                        </h5>
                        <div className="bg-background rounded p-2">
                          <p className="text-sm font-mono whitespace-pre-wrap">
                            {nodeData.delegation_prompt}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ) : currentNode ? (
            // Node configuration view
            <div>
              <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-lg mb-2">
                  {currentNode.isTrigger
                    ? `Trigger: ${currentNode.name}`
                    : `Node ${currentNode.id}: ${currentNode.name}`}
                </h3>
                <p className="text-gray-300 text-sm">
                  {currentNode.description || "No description available."}
                </p>
              </div>

              {/* Config Inputs */}
              {currentNode.config_inputs &&
                Object.keys(currentNode.config_inputs).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2">Config Inputs</h4>
                    {Object.entries(currentNode.config_inputs).map(
                      ([key, value]: [string, any]) => (
                        <div key={key} className="mb-4">
                          <label className="block text-text-secondary mb-1">
                            {key}
                          </label>
                          <input
                            type="text"
                            className="w-full bg-background border border-gray-700 rounded p-2 text-text"
                            value={
                              allConfigInputs[
                                currentNode.isTrigger
                                  ? "trigger"
                                  : currentNode.id
                              ]?.config_inputs?.[key] || ""
                            }
                            onChange={(e) =>
                              handleConfigInputChange(key, e.target.value)
                            }
                            placeholder={`Enter value for ${key}`}
                          />
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* LLM Prompt */}
              {currentNode.llm_prompt && (
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-2">LLM Prompt</h4>
                  <textarea
                    className="w-full bg-background border border-gray-700 rounded p-2 text-text min-h-[150px]"
                    value={
                      allConfigInputs[
                        currentNode.isTrigger ? "trigger" : currentNode.id
                      ]?.llm_prompt || ""
                    }
                    onChange={(e) =>
                      handlePromptChange("llm_prompt", e.target.value)
                    }
                    placeholder="Enter LLM prompt"
                  />
                </div>
              )}

              {/* Validation Prompt */}
              {currentNode.validation_prompt && (
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-2">
                    Validation Prompt
                  </h4>
                  <textarea
                    className="w-full bg-background border border-gray-700 rounded p-2 text-text min-h-[150px]"
                    value={
                      allConfigInputs[
                        currentNode.isTrigger ? "trigger" : currentNode.id
                      ]?.validation_prompt || ""
                    }
                    onChange={(e) =>
                      handlePromptChange("validation_prompt", e.target.value)
                    }
                    placeholder="Enter validation prompt"
                  />
                </div>
              )}

              {/* Delegation Prompt */}
              {currentNode.delegation_prompt && (
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-2">
                    Delegation Prompt
                  </h4>
                  <textarea
                    className="w-full bg-background border border-gray-700 rounded p-2 text-text min-h-[150px]"
                    value={
                      allConfigInputs[
                        currentNode.isTrigger ? "trigger" : currentNode.id
                      ]?.delegation_prompt || ""
                    }
                    onChange={(e) =>
                      handlePromptChange("delegation_prompt", e.target.value)
                    }
                    placeholder="Enter delegation prompt"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">No configuration needed.</div>
          )}
        </div>

        {/* Dialog footer */}
        <div className="border-t border-gray-700 p-4 flex justify-between">
          {isConfirmView ? (
            <>
              <button
                onClick={() => {
                  setIsConfirmView(false);
                  setCurrentStep(editableNodes.length - 1);
                }}
                className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Editing
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`flex items-center px-4 py-2 ${
                  isSubmitting
                    ? "bg-gray-600"
                    : "bg-green-600 hover:bg-green-700"
                } rounded-md transition-colors`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={18} className="mr-2" />
                    Confirm & Make Public
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`px-4 py-2 border border-gray-600 rounded-md transition-colors ${
                  currentStep === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-700"
                }`}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                {currentStep < editableNodes.length - 1 ? (
                  <>
                    Next <ArrowRight size={18} className="ml-2" />
                  </>
                ) : (
                  <>
                    Review All <Check size={18} className="ml-2" />
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Public URL Dialog */}
        {isPublished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 relative z-10 shadow-2xl border border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-white">
                Workflow Published!
              </h2>
              <p className="text-gray-300 mb-4">
                Your workflow is now public. Share this link with others to let
                them view and use your workflow:
              </p>
              <div className="flex items-center mb-6">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 p-3 bg-gray-900 text-white border border-gray-700 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-3 bg-gray-700 border border-gray-600 rounded-r hover:bg-gray-600 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check size={20} className="text-green-500" />
                  ) : (
                    <Copy size={20} />
                  )}
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicDialogue;
