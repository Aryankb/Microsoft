import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw, AlertTriangle, Copy } from 'lucide-react';
import '../styles/PromptGenerator.css';

interface PromptGeneratorProps {
  isOpen: boolean;
  onToggle: () => void;
  onPromptGenerated: (prompt: string) => void;
  onRegenerateWorkflow?: (prompt: string, type?: boolean) => void;
  currentWorkflowData?: any;
  originalPrompt?: string;
  workflowUnavailable?: string;
  showWorkflow?: boolean;
}

const PromptGenerator: React.FC<PromptGeneratorProps> = ({ 
  isOpen, 
  onToggle, 
  onPromptGenerated,
  onRegenerateWorkflow,
  currentWorkflowData,
  originalPrompt = '',
  workflowUnavailable,
  showWorkflow = false
}) => {
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Update the edited prompt when originalPrompt changes
  useEffect(() => {
    if (originalPrompt) {
      setEditedPrompt(originalPrompt);
    } else if (currentWorkflowData?.refinedQuery) {
      setEditedPrompt(currentWorkflowData.refinedQuery);
    }
  }, [originalPrompt, currentWorkflowData]);

  const handleGenerateClick = () => {
    if (onRegenerateWorkflow && editedPrompt.trim()) {
      onRegenerateWorkflow(editedPrompt.trim(), false);
    }
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(editedPrompt);
    // You could add a toast notification here
    alert('Prompt copied to clipboard');
  };
  
  return (
    <div className={`prompt-generator ${isOpen ? 'open' : 'closed'}`}>
      <button className="toggle-button" onClick={onToggle}>
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
      
      {isOpen && (
        <div className="prompt-generator-content">
          <h3 className="prompt-generator-title">
            <Sparkles size={16} className="sparkles-icon" />
            Workflow Prompt
          </h3>
          
          <div className="refined-query-display">
            <div className="refined-query-header">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-400 mr-2"></div>
                <label className="font-medium">Workflow Generated From:</label>
              </div>
              
              <div className="refined-query-actions">
                <button 
                  onClick={toggleEditing} 
                  className="action-button"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
                
                <button 
                  onClick={handleCopyPrompt}
                  className="action-button"
                >
                  <Copy size={14} className="mr-1" />
                  Copy
                </button>
              </div>
            </div>
            
            {isEditing ? (
              <div className="refined-query-editor">
                <textarea 
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  rows={6}
                  className="refined-query-textarea"
                  placeholder="Enter your workflow prompt here..."
                />
                
                <button 
                  className="generate-workflow-button" 
                  onClick={handleGenerateClick}
                  disabled={!editedPrompt.trim() || !onRegenerateWorkflow}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Generate New Workflow
                </button>
              </div>
            ) : (
              <div className="refined-query-view">
                <div className="refined-query-display-box">
                  {editedPrompt || "No prompt data available"}
                </div>
                
                <button 
                  className="generate-workflow-button" 
                  onClick={toggleEditing}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Modify and Generate New Workflow
                </button>
              </div>
            )}
            
            {/* Display unavailability warning if present */}
            {workflowUnavailable && (
              <div className="workflow-warning my-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle size={16} className="mr-2" />
                  <span className="font-medium">Availability Warning</span>
                </div>
                <p className="text-sm">{workflowUnavailable}</p>
                <p className="text-sm font-medium mt-2">
                  THE GENERATED WORKFLOW MIGHT NOT WORK BECAUSE OF UNAVAILABILITY
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptGenerator;
