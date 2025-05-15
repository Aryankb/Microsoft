// filepath: d:\Code\Startup\sigmoydfrontend\sigmoyd_frontent\src\pages\Home.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Calendar, Mail, Users, ArrowUpRight, Zap } from 'lucide-react';
import VanishingMessageInput from '../components/VanishingMessageInput.jsx'; // Adjusted path
import '../styles/components/ChatStyles.css'; // Adjusted path
import '../styles/components/WorkflowLoadingAnimation.css'; // Adjusted path
import '../styles/global.css'; // Import global CSS
import { BackgroundBeamsWithCollision } from '../components/ui/background-beams-with-collision';

const EXAMPLE_PROMPTS = [
  "Create a workflow for social media post scheduling",
  "Build an email automation workflow",
  "Design a customer onboarding workflow",
];

// Define a more specific type for chat messages
interface ChatMessage {
  id: string;
  message: React.ReactNode; // Using ReactNode to allow JSX
  sender: string;
  isLog?: boolean;
  log?: any;
}

// Define a type for Q&A pairs
interface QandAPair {
  [key: string]: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [message, setMessage] = useState("");
  const [refinedQuery, setRefinedQuery] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([]); // Use defined ChatMessage type
  const [qanda, setQanda] = useState<QandAPair>({}); // Use defined QandAPair type
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [bootPhase, setBootPhase] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [workflowLogs, setWorkflowLogs] = useState<any[]>([]);
  const [editingPrompt, setEditingPrompt] = useState("");
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const bootSequence = [
    "Initializing workflow engine...",
    "Analyzing requirements...",
    "Loading available tools...",
    "Finding optimal tool combinations...",
    "Configuring API connections...",
    "Setting up data flows...",
    "Creating intelligent agents...",
    "Establishing workflow patterns...",
    "Building execution paths...",
    "Optimizing workflow logic...",
    "Running security checks...",
    "Finalizing configuration...",
    "Workflow generation complete.",
  ];

  const handleInputFocus = () => {
    if (chats.length > 0 && !refinedQuery) {
      console.log("Clearing selected prompt");
      setSelectedPrompt("");
    }
    setIsInputFocused(true);
    setIsDropdownVisible(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsInputFocused(false);
      setTimeout(() => {
        setIsDropdownVisible(false);
      }, 300);
    }, 200);
  };

  useEffect(() => {
    if (isDropdownVisible && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('.dropdown-item');
      items.forEach((item, index) => {
        setTimeout(() => {
          (item as HTMLElement).style.opacity = '1';
          (item as HTMLElement).style.transform = 'translateY(0)';
        }, 50 + (index * 30));
      });
    }
  }, [isDropdownVisible]);

  useEffect(() => {
    console.log("Selected prompt:", selectedPrompt);
    console.log("Message:", message);
  }, [selectedPrompt, message]);

  const getPromptIcon = (promptText: string) => {
    if (promptText.toLowerCase().includes("social media") || promptText.toLowerCase().includes("post scheduling")) {
      return <Calendar className="w-5 h-5 text-blue-400" />;
    } else if (promptText.toLowerCase().includes("email")) {
      return <Mail className="w-5 h-5 text-green-400" />;
    } else if (promptText.toLowerCase().includes("customer") || promptText.toLowerCase().includes("onboarding")) {
      return <Users className="w-5 h-5 text-purple-400" />;
    } else {
      return <ArrowUpRight className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatQuestionWithOptions = (questionText: string) => {
    if (!questionText || typeof questionText !== 'string') return questionText;
    
    const parts = questionText.split('*').map(part => part.trim());
    const question = parts[0];
    const options = parts.slice(1).filter(Boolean);
    
    return (
      <div className="formatted-options">
        <p className="mb-4">{question}</p>
        <div className="options-container">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => setMessage(option)}
              className="block w-full text-left mb-3 px-4 py-3 bg-gray-500 hover:bg-gray-700 text-white rounded-md transition-colors duration-200 text-sm font-medium"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleExamplePromptSelect = (promptText: string) => {
    setSelectedPrompt(promptText);
    setMessage(promptText);
    setIsDropdownVisible(false);
    setTimeout(() => handleSend(), 200);
  };

  const renderObjectValue = (obj: any): React.ReactNode => {
    if (Array.isArray(obj)) {
      return (
        <div className="pl-2 mt-1">
          {obj.map((item, index) => (
            <div key={index} className="mb-1">
              {typeof item === 'object' && item !== null
                ? renderObjectValue(item)
                : String(item)}
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="pl-2 mt-1">
        {Object.entries(obj).map(([k, v], idx) => (
          <div key={idx} className="mb-1">
            <span className="font-medium text-blue">{k}: </span>
            {typeof v === 'object' && v !== null
              ? renderObjectValue(v)
              : String(v)}
          </div>
        ))}
      </div>
    );
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const currentMessage = message.trim();
    const userMessageId = Date.now().toString();
    const botMessageId = (Date.now() + 1).toString();

    const updatedChats: ChatMessage[] = [
      ...chats,
      { id: userMessageId, message: message.trim(), sender: "user" },
      {
        id: botMessageId,
        message: (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        ),
        sender: "bot",
      },
    ];
    
    setChats(updatedChats);
    
    if (questions.length > 0 && currentQuestionIndex <= questions.length) {
      const updatedQandA: QandAPair = {
        ...qanda,
        [questions[currentQuestionIndex - 1]]: message.trim(),
      };
      setQanda(updatedQandA);

      if (currentQuestionIndex + 1 <= questions.length) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        const nextQuestion = questions[currentQuestionIndex];
        
        const botIndex = updatedChats.findIndex((chat) => chat.id === botMessageId);

        if (botIndex !== -1) {
          const modifiedChats = [
            ...updatedChats.slice(0, botIndex),
            {
              id: botMessageId,
              message: formatQuestionWithOptions(nextQuestion),
              sender: "bot",
            },
            ...updatedChats.slice(botIndex + 1),
          ];
          
          setChats(modifiedChats);
        }
      } else {
        try {
          const typingChats = updatedChats.map((chat) =>
            chat.id === botMessageId
              ? {
                  ...chat,
                  message: (
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  ),
                }
              : chat
          );
          
          setChats(typingChats);
          setQuestions([]);
          
          await sendRefinedQuery(updatedQandA);
          
          const finalChats = typingChats.map((chat) =>
            chat.id === botMessageId
              ? {
                  ...chat,
                  message: <p>I've refined your workflow requirements based on our conversation.</p>,
                }
              : chat
          );
          
          setChats(finalChats);
          setMessage("");
        } catch (error) {
          console.error("Error in conversation flow:", error);
          const errorChats = updatedChats.map((chat) =>
            chat.id === botMessageId
              ? {
                  ...chat,
                  message: "Error refining your query. Please try again.",
                }
              : chat
          );
          
          setChats(errorChats);
        }
      }
      setMessage("");
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/refine_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: message.trim(), flag: 0, question: {} }),
      });
      const data = await response.json();

      if (data.response && Array.isArray(data.response) && data.response.length > 0) {
        setQuestions(data.response);
        setCurrentQuestionIndex(1);

        const question = data.response[0];
        
        const botIndex = updatedChats.findIndex((chat) => chat.id === botMessageId);
        
        if (botIndex !== -1) {
          const modifiedChats = [
            ...updatedChats.slice(0, botIndex),
            {
              id: botMessageId,
              message: formatQuestionWithOptions(question),
              sender: "bot",
            },
            ...updatedChats.slice(botIndex + 1),
          ];
          
          setChats(modifiedChats);
        }
      } else {
        const updatedQandA = { ...qanda, ["user"]: message.trim() };
        await sendRefinedQuery(updatedQandA);
        
        const finalChats = updatedChats.map((chat) =>
          chat.id === botMessageId
            ? {
                ...chat,
                message: <p>I've refined your workflow requirements based on your request.</p>,
              }
            : chat
        );
        
        setChats(finalChats);
      }
    } catch (error) {
      console.error("Error fetching refine_query:", error);
      const errorChats = updatedChats.map((chat) =>
        chat.id === botMessageId
          ? {
              ...chat,
              message:
                "I encountered an error processing your request. Please try again.",
            }
          : chat
      );
      
      setChats(errorChats);
    }
    
    setMessage("");
    
    if (chats.length === 0 && currentMessage === selectedPrompt) {
      console.log("Keeping selected prompt:", selectedPrompt);
    }
  };

  const sendRefinedQuery = async (currentQandA: QandAPair) => {
    try {
      const token = await getToken();
      let queryText = message.trim();
      const firstUserMessage = chats.find(chat => chat.sender === 'user');
      if (firstUserMessage && typeof firstUserMessage.message === 'string') {
        queryText = firstUserMessage.message.trim();
      }

      const response = await fetch("http://localhost:8000/refine_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: queryText,
          flag: 1,
          question: currentQandA,
        }),
      });
      const data = await response.json();
      setRefinedQuery(data.response);
    } catch (error) {
      console.error("Error sending refined query:", error);
      setChats(prevChats => [
        ...prevChats,
        {
          id: Date.now().toString(),
          message: `I encountered an error refining your query. Please try again.`,
          sender: "bot",
        }
      ]);
    }
  };

  const handleGenerateWorkflow = async () => {
    try {
      console.log("Generating workflow with query:", refinedQuery);
      
      if (!refinedQuery) {
        console.error("No refined query available for workflow generation");
        setChats(prevChats => [
          ...prevChats,
          {
            id: Date.now().toString(),
            message: "Error: Cannot generate workflow without a refined query. Please try again.",
            sender: "bot",
          }
        ]);
        return;
      }

      const token = await getToken();
      setLoading(true);
      setBootPhase(0);
      setLoadingProgress(0);

      let currentPhase = 0;

      const advancePhase = () => {
        if (currentPhase < bootSequence.length - 1) {
          currentPhase++;
          setBootPhase(currentPhase);
          setLoadingProgress(
            Math.floor((currentPhase / (bootSequence.length - 1)) * 100)
          );

          const delay = Math.random() * 300 + 400;
          setTimeout(advancePhase, delay);
        }
      };

      setTimeout(() => {
        advancePhase();
      }, 500);

      const requestPayload = {
        query: refinedQuery,
        flag: 0, 
        wid: ""
      };
      console.log("Workflow generation request payload:", requestPayload);

      const response = await fetch("http://localhost:8000/create_agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();
      console.log("Workflow generation response:", data);

      if (!data.response || !data.response.workflow_id) {
        console.error("Invalid workflow generation response:", data);
        setLoading(false);
        setLoadingProgress(0);
        
        throw new Error("Received invalid workflow data from server");
      }
      
      setTimeout(() => {
        setLoading(false);
        navigate(`/workflows/${data.response.workflow_id}`, { 
          replace: true,
          state: { 
            newWorkflow: true,
            workflowJson: data.response,
            refinedQuery: refinedQuery
          }
        });
      }, Math.max(1000, (bootSequence.length - bootPhase) * 500));
      
    } catch (error: unknown) {
      console.error("Error generating workflow:", error);
      setLoading(false);
      setLoadingProgress(0);
      
      setChats(prevChats => [
        ...prevChats,
        {
          id: Date.now().toString(),
          message: `Error generating workflow: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
          sender: "bot",
        }
      ]);
    }
  };

  const handleRegenerateWorkflow = async () => {
    if (!editingPrompt.trim()) {
      alert("Please enter a prompt before regenerating the workflow");
      return;
    }
    
    const modifiedPrompt = editingPrompt;
    setShowPromptEditor(false);
    setLoading(true);
    setBootPhase(0);
    setLoadingProgress(0);
    
    try {
      const token = await getToken();
      const userMessageId = Date.now().toString();
      const botMessageId = (Date.now() + 1).toString();
      
      const updatedChats = [
        ...chats,
        { id: userMessageId, message: `Regenerating workflow with: ${modifiedPrompt}`, sender: "user" },
        {
          id: botMessageId,
          message: (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          ),
          sender: "bot",
        },
      ];
      
      setChats(updatedChats);
      
      let currentPhase = 0;
      const advancePhase = () => {
        if (currentPhase < bootSequence.length - 1) {
          currentPhase++;
          setBootPhase(currentPhase);
          setLoadingProgress(
            Math.floor((currentPhase / (bootSequence.length - 1)) * 100)
          );

          const delay = Math.random() * 300 + 400;
          setTimeout(advancePhase, delay);
        }
      };

      setTimeout(() => {
        advancePhase();
      }, 500);
      
      const requestPayload = {
        query: modifiedPrompt,
        flag: 0, 
        wid: ""
      };
      
      const response = await fetch("http://localhost:8000/create_agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();
      
      if (!data.response || !data.response.workflow_id) {
        throw new Error("Received invalid workflow data from server");
      }
      
      setRefinedQuery(modifiedPrompt);
      
      setTimeout(() => {
        setLoading(false);
        navigate(`/workflows/${data.response.workflow_id}`, { 
          replace: true,
          state: { 
            newWorkflow: true,
            workflowJson: data.response,
            refinedQuery: modifiedPrompt
          }
        });
      }, Math.max(1000, (bootSequence.length - bootPhase) * 500));
      
    } catch (error: unknown) {
      console.error("Error regenerating workflow:", error);
      setLoading(false);
      setLoadingProgress(0);
      
      setChats(prevChats => [
        ...prevChats,
        {
          id: Date.now().toString(),
          message: `Error regenerating workflow: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
          sender: "bot",
        }
      ]);
    }
  };

  const displayWorkflowLog = (log: any) => {
    return (
      <div className="workflow-log mb-4 border border-gray-700 rounded-lg overflow-hidden">
        <div className="log-header flex items-center justify-between bg-gray-800 p-2">
          <span className="log-agent font-bold text-white">{log.agent_name}</span>
          <span className="log-status flex items-center">
            {log.status === "executed successfully" ? (
              <span className="text-green-500 mr-2">✓</span>
            ) : (
              <span className="text-yellow-500 mr-2">⚠</span>
            )}
            {log.status}
          </span>
          <span className="log-time text-sm text-gray-400">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="log-content bg-gray-900 p-3 rounded-b-md">
          <div className="data-flow-notebook p-3 rounded-md">
            {Object.entries(log.data || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-gray-700 py-1">
                <span className="font-medium text-blue-400">{key}:</span>
                <span className="text-gray-200">
                  {typeof value === 'object' && value !== null
                    ? renderObjectValue(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-2 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
          <span className="text-sm text-gray-400">Want to modify and regenerate this workflow?</span>
          <button 
            onClick={() => {
              setEditingPrompt(refinedQuery || "");
              setShowPromptEditor(true);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
          >
            Regenerate
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <BackgroundBeamsWithCollision>
        <div className="absolute inset-0 w-screen h-screen opacity-5">
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:24px_24px]"></div>
        </div>
      </BackgroundBeamsWithCollision>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="container mx-auto px-4 pt-16 pb-20 flex-grow flex flex-col">
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
              <div className="boot-container">
                <div className="boot-header">
                  <h1 className="boot-title">SIGMOYD AI</h1>
                  <p className="boot-subtitle">WORKFLOW GENERATION SEQUENCE</p>
                </div>

                <div className="boot-terminal">
                  <div className="boot-console">
                    {bootSequence.slice(0, bootPhase + 1).map((text, index) => (
                      <div key={index} className="boot-line">
                        <span className="boot-prompt">&gt;</span>
                        <div className={`boot-message ${index === bootPhase ? "boot-cursor" : ""}`}>
                          {text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="boot-progress-container">
                    <div className="boot-progress-bar">
                      <div
                        className="boot-progress-fill"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <div className="boot-progress-text">{loadingProgress}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {showPromptEditor && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="text-white font-bold">Modify Workflow Prompt</h3>
                  <button 
                    onClick={() => setShowPromptEditor(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <textarea
                    value={editingPrompt}
                    onChange={(e) => setEditingPrompt(e.target.value)}
                    className="w-full h-40 bg-gray-800 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Modify the workflow prompt here..."
                  />
                </div>
                <div className="p-4 bg-gray-800 flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowPromptEditor(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRegenerateWorkflow}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Regenerate Workflow
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {chats.length === 0 ? (
            <div className="max-w-5xl mx-auto flex-1 flex flex-col justify-center">
              <div className="text-center mb-8">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
                  Build AI Workflows <br />Without Code
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                  Connect AI agents, tools, and data sources to create powerful automated workflows. 
                  Design once, run continuously.
                </p>
                
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-2xl mb-4 relative">
                    <div className="relative p-1 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl">
                      <VanishingMessageInput
                        message={message}
                        setMessage={setMessage}
                        handleSend={handleSend}
                        placeholder="Describe the workflow you want to build..."
                        priorityPlaceholder={selectedPrompt}
                        showWorkflow={false}
                        handleQueryUpdate={() => {}}
                        isDisabled={false}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </div>

                    <div 
                      ref={dropdownRef}
                      className={`absolute w-full mt-2 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-300 ease-in-out ${
                        isInputFocused 
                          ? 'opacity-100 max-h-[300px]' 
                          : 'opacity-0 max-h-0 pointer-events-none'
                      }`}
                      style={{
                        transformOrigin: 'top center',
                        transform: isInputFocused ? 'scaleY(1)' : 'scaleY(0.95)',
                      }}
                    >
                      {EXAMPLE_PROMPTS.length > 0 && isDropdownVisible && EXAMPLE_PROMPTS.map((promptText, index) => (
                        <div
                          key={index}
                          className="dropdown-item px-4 py-3 hover:bg-gray-700 cursor-pointer text-gray-200 flex items-center gap-3 transition-all duration-200 ease-out opacity-0"
                          style={{ 
                            transform: 'translateY(10px)',
                            transitionProperty: 'background-color, opacity, transform',
                          }}
                          onClick={() => handleExamplePromptSelect(promptText)}
                        >
                          <div className="flex-shrink-0 bg-gray-700 p-2 rounded-full transition-transform duration-200 ease-out hover:scale-110">
                            {getPromptIcon(promptText)}
                          </div>
                          <span className="transition-colors duration-200">{promptText}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full h-full flex flex-col rounded-xl overflow-hidden bg-gray-900 shadow-2xl border border-gray-800">
              <div className="p-4 border-b border-gray-800 bg-black">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Zap size={18} className="text-gray-400 mr-2" />
                  Workflow Assistant
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gradient-to-b from-gray-900 to-black" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`w-full flex ${
                      chat.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div 
                      className={`message-bubble max-w-[85%] ${
                        chat.sender === "user" 
                          ? "bg-white text-black" 
                          : "bg-gray-800 text-gray-200 border border-gray-700"
                      } p-4 rounded-2xl shadow-md`}
                      style={{
                        alignSelf: chat.sender === "user" ? "flex-end" : "flex-start"
                      }}
                    >
                      {typeof chat.message === 'string' && chat.message.includes('*') && chat.sender !== 'user' 
                        ? formatQuestionWithOptions(chat.message as string)
                        : chat.isLog ? displayWorkflowLog(chat.log)
                        : <div>{chat.message}</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-800 bg-black">
                {refinedQuery ? (
                  <div className="mb-4 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-3 bg-black border-b border-gray-800 flex items-center justify-between">
                      <h3 className="text-white font-medium flex items-center">
                        <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                        Workflow Requirements Ready
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingPrompt(refinedQuery);
                            setShowPromptEditor(true);
                          }}
                          className="text-gray-400 hover:text-gray-200 text-xs flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(refinedQuery);
                          }}
                          className="text-gray-400 hover:text-gray-200 text-xs flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-4 text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
                        {refinedQuery}
                      </div>
                      <button 
                        onClick={handleGenerateWorkflow}
                        className="w-full py-4 px-6 bg-white text-black hover:bg-gray-200 rounded-lg shadow-lg transition-all duration-300 font-medium flex items-center justify-center group"
                      >
                        <span className="mr-2">Generate Workflow</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <VanishingMessageInput
                    message={message}
                    setMessage={setMessage}
                    handleSend={handleSend}
                    placeholder="Your response..."
                    priorityPlaceholder={selectedPrompt}
                    showWorkflow={false}
                    handleQueryUpdate={() => {}}
                    isDisabled={false}
                    onFocus={() => handleInputFocus()}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
