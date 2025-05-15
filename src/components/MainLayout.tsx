import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@clerk/clerk-react";
import WorkflowGraph from "./WorkflowGraph.tsx";
import ChatInterface from "./ChatInterface";
import QueryRefiner from "./QueryRefiner";
import VanishingMessageInput from "./VanishingMessageInput.jsx";
import { useWorkflowLogs, LogMessage } from "./FetchLogs";
import "../styles/ChatStyles.css";
import "../styles/WorkflowLoadingAnimation.css";
import { useConversation } from "../contexts/ConversationContext";
import { useNavigate } from "react-router-dom";

const EXAMPLE_PROMPTS = [
  "Create a workflow for social media post scheduling",
  "Build an email automation workflow",
  "Design a customer onboarding workflow",
];

export default function MainLayout() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"workflow" | "general">("workflow");
  const [flag, setFlag] = useState(2);
  const [qanda, setQanda] = useState<{ [key: string]: string }>({});
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [bootPhase, setBootPhase] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const [fullScreenWorkflow, setFullScreenWorkflow] = useState(false);
  const navigate = useNavigate();
  
  // Use the conversation context for URL-based conversation state
  const { 
    currentConversation, 
    updateConversation, 
    createNewConversation,
    workflows, 
    setWorkflows 
  } = useConversation();

  // Get the conversation messages, refinedQuery, and workflow state from the context
  const chats = currentConversation?.messages || [];
  const refinedQuery = currentConversation?.refinedQuery;
  const workflowJson = currentConversation?.workflowJson;
  const showWorkflow = currentConversation?.showWorkflow || false;
  const currentWorkflow = currentConversation?.currentWorkflowId;

  const currentWorkflowObject = workflows.find((w) => w.id === currentWorkflow);

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

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessageId = Date.now().toString();
    const botMessageId = (Date.now() + 1).toString();

    // Add the user and bot messages to the conversation
    const updatedChats = [
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
    
    updateConversation({ messages: updatedChats });
    setMessage("");

    if (mode === "general") {
      try {
        const token = await getToken();
        const response = await fetch("http://localhost:8000/general", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: message.trim() }),
        });
        const data = await response.json();

        const finalChats = updatedChats.map((chat) =>
          chat.id === botMessageId
            ? { ...chat, message: data.response }
            : chat
        );
        
        updateConversation({ messages: finalChats });
      } catch (error) {
        const errorChats = updatedChats.map((chat) =>
          chat.id === botMessageId
            ? {
                ...chat,
                message:
                  "Sorry, I couldn't process that request. Please try again.",
              }
            : chat
        );
        
        updateConversation({ messages: errorChats });
      }
      return;
    }

    if (flag === 2) setFlag(0);

    if (questions.length > 0 && currentQuestionIndex <= questions.length) {
      const updatedQandA = {
        ...qanda,
        [questions[currentQuestionIndex - 1]]: message.trim(),
      };
      setQanda(updatedQandA);

      if (currentQuestionIndex + 1 <= questions.length) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        const formattedMessage = questions[currentQuestionIndex]
          .trim()
          .split("*")
          .map((part, index) => {
            if (index === 0) return part;
            return (
              <span key={index}>
                <br />*{" "}
                <span
                  onClick={() => setMessage(part.trim())}
                  className="cursor-pointer text-blue-500"
                >
                  {part.trim()}
                </span>
              </span>
            );
          });

        const botIndex = updatedChats.findIndex(
          (chat) => chat.id === botMessageId
        );

        if (botIndex !== -1) {
          const modifiedChats = [
            ...updatedChats.slice(0, botIndex),
            {
              id: botMessageId,
              message: <div>{formattedMessage}</div>,
              sender: "bot",
            },
            ...updatedChats.slice(botIndex + 1),
          ];
          
          updateConversation({ messages: modifiedChats });
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
          
          updateConversation({ messages: typingChats });

          setQuestions([]);
          console.log("Q&A:", updatedQandA);
          await sendRefinedQuery(updatedQandA);

          const filteredChats = typingChats.filter((chat) => chat.id !== botMessageId);
          updateConversation({ messages: filteredChats });
        } catch (error) {
          const errorChats = updatedChats.map((chat) =>
            chat.id === botMessageId
              ? {
                  ...chat,
                  message: "Error refining your query. Please try again.",
                }
              : chat
          );
          
          updateConversation({ messages: errorChats });
        }
      }
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

      if (data.response.length > 0) {
        const formattedMessage = data.response[0]
          .trim()
          .split("*")
          .map((part, index) => {
            if (index === 0) return part;
            return (
              <span key={index}>
                <br />*{" "}
                <span
                  onClick={() => setMessage(part.trim())}
                  className="cursor-pointer text-blue-500"
                >
                  {part.trim()}
                </span>
              </span>
            );
          });
        setQuestions(data.response);
        setCurrentQuestionIndex(1);

        const finalChats = updatedChats.map((chat) =>
          chat.id === botMessageId
            ? { ...chat, message: <div>{formattedMessage}</div> }
            : chat
        );
        
        updateConversation({ messages: finalChats });
      } else {
        const finalChats = updatedChats.map((chat) =>
          chat.id === botMessageId
            ? {
                ...chat,
                message:
                  "I don't have any clarifying questions. Would you like me to generate a workflow based on your query?",
              }
            : chat
        );
        
        updateConversation({ messages: finalChats });
      }
    } catch (error) {
      const errorChats = updatedChats.map((chat) =>
        chat.id === botMessageId
          ? {
              ...chat,
              message:
                "I encountered an error processing your request. Please try again.",
            }
          : chat
      );
      
      updateConversation({ messages: errorChats });
    }
  };

  const handleQueryUpdate = async (update: string) => {
    try {
      const token = await getToken();
      setMessage("");
      const updatedQandA = { ...qanda, ["user"]: update.trim() };
      setQanda(updatedQandA);
      console.log("Q&A:", updatedQandA);
      console.log("refinedQuery:", refinedQuery);
      const response = await fetch("http://localhost:8000/refine_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: refinedQuery,
          flag: 1,
          question: updatedQandA,
        }),
      });
      const data = await response.json();
      
      updateConversation({ 
        refinedQuery: data.response,
        messages: [
          {
            id: (Date.now() + 2).toString(),
            message: "UPDATED QUERY :-",
            sender: "bot",
          }
        ]
      });
    } catch (error) {
      console.error("Error updating query:", error);
    }
  };

  const sendRefinedQuery = async (updatedQandA: any) => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/refine_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: chats[0].message.toString().trim(),
          flag: 1,
          question: updatedQandA,
        }),
      });
      const data = await response.json();
      updateConversation({ refinedQuery: data.response });
    } catch (error) {
      console.error("Error sending refined query:", error);
      updateConversation({
        messages: [
          {
            id: Date.now().toString(),
            message:
              "I encountered an error refining your query. Please try again.",
            sender: "bot",
          }
        ]
      });
    }
  };

  const handleModeChange = (newMode: "workflow" | "general") => {
    if (mode !== newMode) {
      setMode(newMode);
      // Create a new conversation for the new mode
      createNewConversation();
      setMessage("");
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setQanda({});
    }
  };

  const handleGenerateWorkflow = async (type: boolean) => {
    try {
      // Debug the refinedQuery value
      console.log("Generating workflow with query:", refinedQuery);
      
      // Check if refinedQuery exists and has content
      if (!refinedQuery) {
        console.error("No refined query available for workflow generation");
        // Show error to user
        updateConversation({
          messages: [
            ...chats,
            {
              id: Date.now().toString(),
              message: "Error: Cannot generate workflow without a refined query. Please try again.",
              sender: "bot",
            }
          ]
        });
        return;
      }

      const token = await getToken();
      setLoading(true);
      setBootPhase(0);
      setBootComplete(false);
      setLoadingStep(bootSequence[0]);
      setLoadingProgress(0);

      let currentPhase = 0;

      const advancePhase = () => {
        if (currentPhase < bootSequence.length - 1) {
          currentPhase++;
          setBootPhase(currentPhase);
          setLoadingStep(bootSequence[currentPhase]);
          setLoadingProgress(
            Math.floor((currentPhase / (bootSequence.length - 1)) * 100)
          );

          const delay = Math.random() * 300 + 400;
          setTimeout(advancePhase, delay);
        } else {
          setBootComplete(true);
        }
      };

      setTimeout(() => {
        advancePhase();
      }, 500);

      // Log the request payload for debugging
      const requestPayload = {
        query: refinedQuery,
        flag: type ? 1 : 0,
        wid: showWorkflow && workflowJson ? workflowJson.workflow_id : "",
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

      // Ensure we stop the loading animation
      setLoading(false);
      setLoadingStep("");
      setLoadingProgress(0);
      setBootComplete(true);

      // Check if the response has the expected structure
      if (!data.response || !data.response.workflow_id) {
        console.error("Invalid workflow generation response:", data);
        throw new Error("Received invalid workflow data from server");
      }
      
      // Update the conversation with the new workflow data
      updateConversation({
        workflowJson: data.response,
        showWorkflow: true,
        currentWorkflowId: data.response.workflow_id
      });
    } catch (error) {
      console.error("Error generating workflow:", error);
      setLoading(false);
      setLoadingStep("");
      setLoadingProgress(0);
      setBootComplete(true);
      
      // Show a user-friendly error message
      updateConversation({
        messages: [
          ...chats,
          {
            id: Date.now().toString(),
            message: `Error generating workflow: ${error.message || "Unknown error"}. Please try again.`,
            sender: "bot",
          }
        ]
      });
    }
  };

  const handleNewChatClick = () => {
    createNewConversation();
    setMessage("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setQanda({});
    setMode("workflow");
  };

  // Add state for workflow logs
  const [workflowLogs, setWorkflowLogs] = useState<LogMessage[]>([]);
  
  // Use the custom hook to connect to WebSocket and receive logs
  useWorkflowLogs((log: LogMessage) => {
    setWorkflowLogs(prevLogs => [...prevLogs, log]);
    
    // If this log belongs to the current workflow, add it to the chat panel
    if (currentWorkflow === log.workflow_id) {
      console.log("Received log:", log);
      const logMessage = (
        <div className="workflow-log">
          <div className="log-header flex items-center justify-between bg-card text-text-primary p-2 rounded-t-md">
            <span className="log-agent font-bold">{log.agent_name}</span>
            <span className="log-status flex items-center">
              {log.status === "executed successfully" ? (
                <span className="text-green-500 mr-2">✔</span>
              ) : (
                <span className="text-yellow-500 mr-2">⚠</span>
              )}
              {log.status}
            </span>
            <span className="log-time text-sm text-gray-400">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="log-content bg-[var(--color-background)] p-3 rounded-b-md">
            <div className="data-flow-notebook bg-[var(--color-background)] p-3 rounded-md shadow-md">
              {Object.entries(log.data).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b py-1">
                  <span className="font-medium text-blue">{key}:</span>
                  <span className="text-white-900">
                    {typeof value === 'object' && value !== null
                      ? renderObjectValue(value)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      
      // Add the log message to the current conversation
      updateConversation({
        messages: [
          ...chats,
          {
            id: Date.now().toString(),
            message: logMessage,
            sender: "bot",
            isLog: true,
            log_id: log.workflow_id,
          }
        ]
      });
    }
  });

  // Helper function to render object values
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

  // Rest of the component remains the same, just using the context values

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] relative">
      {loading && (
        <div className="boot-overlay fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          {/* ...existing code... */}
        </div>
      )}

      <div className="fixed top-0 left-0 right-0 z-50 bg-black">
        <TopBar
          onMenuClick={() => setShowSidebar(true)}
          onNewChatClick={handleNewChatClick}
          sidebarVisible={showSidebar}
          currentWorkflow={
            currentWorkflowObject
              ? {
                  name: currentWorkflowObject.name,
                  id: currentWorkflowObject.id,
                }
              : null
          }
          onWorkflowsClick={() => navigate('/workflows')} // Add this prop
        />
      </div>

      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onNewChatClick={handleNewChatClick}
        setWorkflowJson={(json) => updateConversation({ workflowJson: json })}
        setRefinedQuery={(query) => updateConversation({ refinedQuery: query })}
        setShowWorkflow={(show) => updateConversation({ showWorkflow: show })}
        workflows={workflows}
        setWorkflows={setWorkflows}
        currentWorkflow={currentWorkflow}
        setCurrentWorkflow={(id) => updateConversation({ currentWorkflowId: id })}
      />

      <main className="flex flex-1 pt-16 pb-24 relative">
        <div
          className={`flex flex-col transition-all duration-500 ease-in-out ${
            showWorkflow
              ? fullScreenWorkflow
                ? "w-0 opacity-0"
                : "w-1/3  bg-[var(--color-background)] z-10"
              : "w-full max-w-4xl mx-auto"
          } px-4 pt-4 overflow-y-auto min-h-full`}
        >
          {chats.length === 0 ? (
            <ChatInterface
              chats={chats}
              message={message}
              setMessage={setMessage}
              handleSend={handleSend}
              examplePrompts={EXAMPLE_PROMPTS}
              mode={mode}
              handleModeChange={handleModeChange}
              showWorkflow={showWorkflow}
              handleQueryUpdate={handleQueryUpdate}
            />
          ) : (
            <div className="chat-container">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`message ${
                    chat.sender === "user" ? "user-message" : chat.isLog ? "bot-message" : "bot-message"
                  }`}
                >
                  { ((workflowJson && workflowJson.workflow_id===chat.log_id) || (!workflowJson)) && 
                    <div className="message-content">{chat.message}</div>
                  }
                  { chat.timestamp && (
                    <div className="message-timestamp">
                      {new Date(chat.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {refinedQuery && !fullScreenWorkflow && (
            <div className="my-4">
              <QueryRefiner
                refinedQuery={refinedQuery}
                setRefinedQuery={(query) => updateConversation({ refinedQuery: query })}
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
        </div>        {showWorkflow && workflowJson && (
          <div
            className={`transition-all duration-500 ease-in-out ${
              fullScreenWorkflow
                ? "w-full fixed left-0 right-0 top-0 bottom-0 z-0 pt-16"
                : "w-2/3 fixed right-0 top-0 bottom-0 z-0 pt-16"
            } pb-8 px-3 mx-auto`}
          >
            {/* Workflow sharing button */}
            <div className="absolute top-20 right-4 z-10 flex items-center">
              <button
                onClick={() => {
                  if (workflowJson && workflowJson.workflow_id) {
                    const url = `${window.location.origin}/workflow/${workflowJson.workflow_id}`;
                    navigator.clipboard.writeText(url);
                    alert('Workflow URL copied to clipboard!');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md shadow text-sm font-medium flex items-center"
                title="Copy shareable link"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Share Workflow
              </button>
            </div>
            
            {/* Updated toggle button for fullscreen workflow */}
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
              setCurrentWorkflow={(id) => updateConversation({ currentWorkflowId: id })}
              currentWorkflow={currentWorkflow}
            />
          </div>
        )}
      </main>

      <div className="input-spacer"></div>

      {chats.length > 0 && !showWorkflow && (
        <div className="message-input-container">
          <div
            className={`message-input-wrapper ${
              showWorkflow ? "with-workflow" : ""
            }`}
          >
            <VanishingMessageInput
              message={message}
              setMessage={setMessage}
              handleSend={handleSend}
              placeholder={
                showWorkflow ? "Update the workflow..." : "Send a message..."
              }
              showWorkflow={showWorkflow}
              handleQueryUpdate={handleQueryUpdate}
              isDisabled={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
