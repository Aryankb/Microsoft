import { useState, useEffect } from 'react';
import { Menu, Mic, Send, Maximize2, CircleDot } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuth } from '@clerk/clerk-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ApiKeyModal from './ApiKeyModal';

const EXAMPLE_PROMPTS = [
  "Create a workflow for social media post scheduling",
  "Build an email automation workflow",
  "Design a customer onboarding workflow"
];

export default function MainLayout() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [message, setMessage] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [workflowExpanded, setWorkflowExpanded] = useState(false);
  const { addWorkflow, currentWorkflow, workflows, addChat } = useWorkflowStore();
  const { getToken } = useAuth();

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/check_api_key', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const hasKey = await response.json();
      setShowApiKeyModal(!hasKey);
    } catch (error) {
      console.error('Error checking API key:', error);
      setShowApiKeyModal(true);
    }
  };

  const handleMicClick = () => {
    if (!isRecording) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);
    }
  };

  

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const token = await getToken();
      const response = await fetch('/fetch_json', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message }),
      });
      const json = await response.json();
      
      // Add new workflow if none exists
      if (!currentWorkflow) {
        addWorkflow('flow_1');
      }
      
      addChat(currentWorkflow!, message);
      setMessage('');
      
      // Handle workflow graph display logic here
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <TopBar onMenuClick={() => setShowSidebar(true)} />
      
      <Sidebar 
        show={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />

      <main className="container mx-auto px-4 pt-20 pb-24">
        {/* Example Prompts */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {EXAMPLE_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => setMessage(prompt)}
              className="px-4 py-2 bg-gray-800 rounded-full text-sm whitespace-nowrap hover:bg-gray-700"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Workflow Display Area */}
        {currentWorkflow && (
          <div className={`bg-gray-800 rounded-lg p-4 mb-6 ${workflowExpanded ? 'fixed inset-0 z-50' : 'h-96'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Workflow View</h2>
              <button
                onClick={() => setWorkflowExpanded(!workflowExpanded)}
                className="p-2 hover:bg-gray-700 rounded"
              >
                <Maximize2 size={20} />
              </button>
            </div>
            {/* WorkflowGraph component would be rendered here */}
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-4 mb-24">
          {currentWorkflow &&
            workflows
              .find((w) => w.id === currentWorkflow)
              ?.chats.map((chat) => (
                <div key={chat.id} className="bg-gray-800 rounded-lg p-4">
                  {chat.message}
                </div>
              ))}
        </div>

        {/* Chat Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4">
          <div className="container mx-auto flex gap-4 items-center">
            <button
              onClick={handleMicClick}
              className={`p-3 rounded-full ${
                isRecording ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Mic size={20} />
            </button>
            
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your workflow..."
              className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={handleSend}
              className="p-3 bg-blue-500 rounded-full hover:bg-blue-600"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>

      <ApiKeyModal 
        show={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)} 
      />
    </div>
  );
}