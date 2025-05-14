import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

// Define the shape of a chat message
interface ChatMessage {
  id: string;
  message: string | React.ReactNode;
  sender: 'user' | 'bot';
  timestamp?: string;
  isLog?: boolean;
  log_id?: string;
}

// Define the shape of a conversation
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  refinedQuery?: string | null;
  workflowJson?: any | null;
  showWorkflow?: boolean;
  currentWorkflowId?: string | null;
}

// Define the shape of a workflow
interface Workflow {
  id: string;
  name: string;
  json: string;
  prompt: string;
  active?: boolean;
  public?: boolean;
}

// Define the context value shape
interface ConversationContextValue {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  createNewConversation: () => void;
  updateConversation: (updates: Partial<Conversation>) => void;
  setCurrentConversationById: (id: string) => void;
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
}

// Create the context
const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

// Provider component
export const ConversationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  // State for conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // State for workflows
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  // Get the current conversation object
  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  // Initialize with a new conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation = createInitialConversation();
      setConversations([newConversation]);
      setCurrentConversationId(newConversation.id);
      navigate('/');
    }
  }, [conversations, navigate]);

  // Helper to create an initial conversation
  function createInitialConversation(): Conversation {
    const id = uuidv4();
    return {
      id,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      refinedQuery: null,
      workflowJson: null,
      showWorkflow: false,
      currentWorkflowId: null
    };
  }

  // Create a new conversation
  const createNewConversation = () => {
    const newConversation = createInitialConversation();
    setConversations(prevConversations => [newConversation, ...prevConversations]);
    setCurrentConversationId(newConversation.id);
    navigate('/');
  };

  // Set the current conversation by ID
  const setCurrentConversationById = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setCurrentConversationId(id);
      navigate(`/c/${id}`);
    }
  };

  // Make sure to preserve refinedQuery when updating a conversation
  const updateConversation = (updates: Partial<Conversation>) => {
    setConversations(prev => {
      const updated = [...prev];
      const index = updated.findIndex(c => c.id === currentConversationId);
      
      if (index !== -1) {
        // Preserve existing refinedQuery if not explicitly updated
        if (!updates.refinedQuery && updated[index].refinedQuery) {
          updates.refinedQuery = updated[index].refinedQuery;
        }
        
        updated[index] = {
          ...updated[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      
      // Save to localStorage
      localStorage.setItem('conversations', JSON.stringify(updated));
      return updated;
    });
  };

  // Load conversations from the server
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const token = await getToken();
        const response = await fetch('http://localhost:8000/conversations', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
          
          // If we have conversations but no current one, set the first one as current
          if (data.length > 0 && !currentConversationId) {
            setCurrentConversationId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };
    
    loadConversations();
  }, [getToken]);

  // Context value
  const value = {
    conversations,
    currentConversation,
    setConversations,
    createNewConversation,
    updateConversation,
    setCurrentConversationById,
    workflows,
    setWorkflows
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

// Custom hook for using this context
export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
