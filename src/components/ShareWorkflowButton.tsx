import React from 'react';
import { useConversation } from '../contexts/ConversationContext';

interface ShareWorkflowButtonProps {
  workflowId: string;
}

const ShareWorkflowButton: React.FC<ShareWorkflowButtonProps> = ({ workflowId }) => {
  const { getWorkflowUrl } = useConversation();
  
  const handleShare = () => {
    if (workflowId) {
      const url = getWorkflowUrl(workflowId);
      navigator.clipboard.writeText(url);
      alert('Workflow URL copied to clipboard!');
    }
  };
  
  return (
    <button
      onClick={handleShare}
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
  );
};

export default ShareWorkflowButton;
