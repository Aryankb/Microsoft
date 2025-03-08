import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '@clerk/clerk-react';
import WorkflowGraph from './WorkflowGraph.tsx';

const EXAMPLE_PROMPTS = [
  "Create a workflow for social media post scheduling",
  "Build an email automation workflow",
  "Design a customer onboarding workflow"
];

type ChatMessage = {
  id: string;
  message: string;
  sender: 'user' | 'bot';
};

type QandA = {
  question: string;
  answer: string;
}[];

export default function MainLayout() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<'workflow' | 'general'>('workflow'); // New toggle state
  const [flag, setFlag] = useState(2);
  const [qanda, setQanda] = useState<{ [key: string]: string }>({});
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { getToken } = useAuth();
  const [refinedQuery, setRefinedQuery] = useState<string | null>(null);
  const [workflowJson, setWorkflowJson] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    if (mode === 'general') {
      // General Query Mode: Send directly to /general
      setChats([...chats, { id: Date.now().toString(), message, sender: 'user' }, { id: (Date.now() + 1).toString(), message: "Fetching response...", sender: 'bot' }]);
      setMessage('');

      try {
        const token = await getToken();
        const response = await fetch("http://localhost:8000/general", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: message.trim() })
        });
        const data = await response.json();
        setChats(prevChats => prevChats.map(chat =>
          chat.message === "Fetching response..." ? { ...chat, message: data.response } : chat
        ));
      } catch (error) {
        setChats(prevChats => prevChats.map(chat =>
          chat.message === "Fetching response..." ? { ...chat, message: "Error fetching response" } : chat
        ));
      }
      return;
    }

    if (flag === 2) setFlag(0);

    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const updatedQandA = { ...qanda, [questions[currentQuestionIndex]]: message.trim() };
      setQanda(updatedQandA);
      setMessage('');

      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setChats([...chats, 
          { id: Date.now().toString(), message: message.trim(), sender: 'user' },
          { id: (Date.now() + 1).toString(), message: questions[currentQuestionIndex + 1], sender: 'bot' }
        ]);
      } else {
        setChats([...chats, 
          { id: Date.now().toString(), message: message.trim(), sender: 'user' },
          { id: (Date.now() + 1).toString(), message: "Refining Query...", sender: 'bot' }
        ]);
        setQuestions([]);
        console.log("Q&A:", updatedQandA);
        await sendRefinedQuery(updatedQandA);
      }
      return;
    }

    const newChats = [
      ...chats,
      { id: Date.now().toString(), message: message.trim(), sender: 'user' },
      { id: (Date.now() + 1).toString(), message: "Thinking...", sender: 'bot' }
    ];
    setChats(newChats);
    setMessage('');

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/refine_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: message.trim() , flag:0,question:{} })
      });
      const data = await response.json();

      if (data.response.length > 0) {
        setQuestions(data.response);
        setCurrentQuestionIndex(0);
        setChats([...newChats, { id: (Date.now() + 2).toString(), message: data.response[0], sender: 'bot' }]);
      } else {
        setChats(prevChats => prevChats.map(chat =>
          chat.message === "Thinking..." ? { ...chat, message: "No questions found" } : chat
        ));
      }
    } catch (error) {
      setChats(prevChats => prevChats.map(chat =>
        chat.message === "Thinking..." ? { ...chat, message: "Error fetching response" } : chat
      ));
    }
  };

  const sendRefinedQuery = async (updatedQandA: QandA) => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/refine_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: chats[0].message.trim(), flag: 1, question: updatedQandA })
      });
      const data = await response.json();
      setRefinedQuery(data.response);
      setChats([...chats, { id: (Date.now() + 2).toString(), message: "REFINED QUERY :-", sender: 'bot' }]);
    } catch (error) {
      console.error("Error sending refined query:", error);
    }
  };
  const handleModeChange = (newMode: 'workflow' | 'general') => {
    if (mode !== newMode) {
      setMode(newMode);
      setChats([]);
      setMessage('');
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setQanda({});
      setRefinedQuery(null);
      setWorkflowJson(null);
      setShowWorkflow(false);
    }
  };

  const handleGenerateWorkflow = async () => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/create_agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: refinedQuery })
      });
      const data = await response.json();
      setWorkflowJson(data.response);
      setShowWorkflow(true);
    } catch (error) {
      console.error("Error generating workflow:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#171717] text-white">
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBar onMenuClick={() => setShowSidebar(true)} />
      </div>

      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />

      <main className={`flex-1 flex ${showWorkflow ? 'flex-row' : 'flex-col'} pt-20 pb-24 px-4 gap-4 relative`}>
      <div className={`${showWorkflow ? 'w-1/3' : 'w-full'} flex flex-col overflow-y-auto z-0`}>  
        
          <div className="flex flex-col space-y-4">
            
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-grow">
                
                <h1 className="text-3xl font-bold mb-4">SIGMOYD</h1>
                <div className="flex gap-4 mb-4">
            <button onClick={() => handleModeChange('workflow')} className={`px-4 py-2 rounded ${mode === 'workflow' ? 'bg-blue-600' : 'bg-gray-700'}`}>Create Workflow</button>
            <button onClick={() => handleModeChange('general')} className={`px-4 py-2 rounded ${mode === 'general' ? 'bg-blue-600' : 'bg-gray-700'}`}>General Query</button>
          </div>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Send a message..."
                  className="w-full max-w-xl bg-gray-700 rounded-lg px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                {mode==='workflow' &&(
                <div className="flex gap-2 overflow-x-auto">
                  {EXAMPLE_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(prompt)}
                      className="px-4 py-2 bg-gray-800 rounded-full text-sm whitespace-nowrap hover:bg-gray-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>)}
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`max-w-[75%] px-4 py-3 rounded-lg ${chat.sender === 'user' ? 'ml-auto bg-blue-500' : 'mr-auto bg-gray-700'}`}
                >
                  {chat.message}
                </div>
              ))
            )}
          </div>
          {refinedQuery && (
            <div className="max-w-[75%] px-10 py-3  rounded-lg mr-auto bg-green-500 text-white">
                           {refinedQuery}
              <button
                onClick={handleGenerateWorkflow}
                className="mt-4 px-4 py-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-all duration-200"
              >
                Generate Workflow
              </button>
            </div>
          )}
        </div>

        {showWorkflow && workflowJson && (
          <div className="w-2/3 fixed right-0 top-0 bottom-0 z-0 pt-8 ">
            <WorkflowGraph workflowJson={workflowJson} />
          </div>
        )}
      </main>
      {chats.length > 0 && (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 z-49">
        <div className="container mx-auto max-w-3xl flex gap-4 items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send a message..."
            className="flex-1 bg-gray-700 rounded-lg px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-3 bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send size={20} />
          </button>
        </div>
      </div>)}
    </div>
  );
}
