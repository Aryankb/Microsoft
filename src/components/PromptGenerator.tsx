import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import '../styles/PromptGenerator.css';

interface PromptGeneratorProps {
  isOpen: boolean;
  onToggle: () => void;
  onPromptGenerated: (prompt: string) => void;
  currentWorkflowData?: any;
}

const PromptGenerator: React.FC<PromptGeneratorProps> = ({ 
  isOpen, 
  onToggle, 
  onPromptGenerated,
  currentWorkflowData
}) => {
  const [promptType, setPromptType] = useState<string>('general');
  const [context, setContext] = useState<string>('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Extract workflow information if available
  useEffect(() => {
    if (currentWorkflowData) {
      // Extract relevant workflow information to populate context
      const nodesInfo = currentWorkflowData.nodes?.map(node => 
        `${node.type}: ${node.data?.label || 'Unnamed'}`
      ).join('\n') || '';
      
      setContext(`Workflow contains:\n${nodesInfo}`);
    }
  }, [currentWorkflowData]);

  const promptTemplates = {
    general: "Generate a prompt that accomplishes the following task:\n\n[CONTEXT]\n\nThe prompt should be clear, concise, and provide specific instructions.",
    llm: "Create an LLM prompt that processes [INPUT] and produces [OUTPUT]. Include specific instructions on formatting, reasoning steps, and error handling.",
    validator: "Create a validation prompt that checks if [INPUT] meets the following criteria: [CRITERIA]. The prompt should instruct the LLM to return only 'VALID' or 'INVALID' with a brief explanation.",
    iterator: "Create an iterator prompt that processes a collection of [ITEMS] and applies the following operation to each: [OPERATION]. Ensure the prompt handles edge cases and maintains context between iterations."
  };

  const generatePrompt = async () => {
    setIsGenerating(true);
    try {
      // Here you would typically call your AI service
      // For now, we'll simulate a response with the template
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const template = promptTemplates[promptType as keyof typeof promptTemplates];
      const generated = template.replace('[CONTEXT]', context);
      
      setGeneratedPrompt(generated);
    } catch (error) {
      console.error("Error generating prompt:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPrompt = () => {
    if (generatedPrompt) {
      onPromptGenerated(generatedPrompt);
    }
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
            Prompt Generator
          </h3>
          
          <div className="prompt-type-selector">
            <label>Prompt Type:</label>
            <select value={promptType} onChange={(e) => setPromptType(e.target.value)}>
              <option value="general">General</option>
              <option value="llm">LLM Node</option>
              <option value="validator">Validator Node</option>
              <option value="iterator">Iterator Node</option>
            </select>
          </div>
          
          <div className="context-input">
            <label>Context/Requirements:</label>
            <textarea 
              value={context} 
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe what you want the prompt to accomplish..."
              rows={5}
            />
          </div>
          
          <button 
            className="generate-button" 
            onClick={generatePrompt} 
            disabled={isGenerating || !context.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate Prompt'}
          </button>
          
          {generatedPrompt && (
            <div className="generated-prompt">
              <label>Generated Prompt:</label>
              <textarea 
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                rows={8}
                readOnly={false}
              />
              <button className="apply-button" onClick={applyPrompt}>
                Apply to Selected Node
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptGenerator;
