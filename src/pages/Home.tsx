// filepath: d:\Code\Startup\sigmoydfrontend\sigmoyd_frontent\src\pages\Home.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Calendar, Mail, Users, ArrowUpRight, Zap } from 'lucide-react';
import VanishingMessageInput from '../components/VanishingMessageInput.jsx'; // Adjusted path
import '../styles/components/ChatStyles.css'; // Adjusted path
import '../styles/components/WorkflowLoadingAnimation.css'; // Adjusted path

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

  const handleSend = async () => {
    if (!message.trim()) return;

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

  return (
    <div className="relative min-h-screen bg-black">
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

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black"></div>
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:24px_24px]"></div>
        </div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-20 h-screen flex flex-col">
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
                        onClick={() => {
                          setMessage(promptText);
                          setTimeout(() => handleSend(), 100);
                        }}
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
                  <div className="p-4">
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
                  showWorkflow={false}
                  handleQueryUpdate={() => {}}
                  isDisabled={false}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
