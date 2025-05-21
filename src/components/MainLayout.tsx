import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@clerk/clerk-react";
import WorkflowGraph from "./WorkflowGraph.tsx";
import ChatInterface from "./ChatInterface";
import QueryRefiner from "./QueryRefiner";
import VanishingMessageInput from "./VanishingMessageInput";
import { useWorkflowLogs, LogMessage } from "./FetchLogs";
import PublicDialogue from "./PublicDialogue"; // Import the new component
import "./ChatStyles.css";
import "./WorkflowLoadingAnimation.css";

const EXAMPLE_PROMPTS = [
  "Create a workflow for social media post scheduling",
  "Build an email automation workflow",
  "Design a customer onboarding workflow",
];

type ChatMessage = {
  id: string;
  message: string | JSX.Element;
  sender: "user" | "bot";
  isLog?: boolean;
  timestamp?: string;
};

interface Workflow {
  id: string;
  name: string;
  json: string;
  prompt: string;
  active?: boolean;
  public?: boolean; // Added public field
  unavailable: string;
}

type QandA = {
  question: string;
  answer: string;
}[];

export default function MainLayout() {
  const { getToken } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<"workflow" | "general">("workflow");
  const [flag, setFlag] = useState(2);
  const [qanda, setQanda] = useState<{ [key: string]: string }>({});
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [refinedQuery, setRefinedQuery] = useState<string | null>(null);
  const [workflowJson, setWorkflowJson] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [bootPhase, setBootPhase] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const [fullScreenWorkflow, setFullScreenWorkflow] = useState(false);
  const [showPublicDialog, setShowPublicDialog] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  const currentWorkflowObject = workflows.find((w) => w.id === currentWorkflow);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessageId = Date.now().toString();
    const botMessageId = (Date.now() + 1).toString();

    setChats((prevChats) => [
      ...prevChats,
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
    ]);

    setMessage("");

    if (mode === "general") {
      try {
        const token = await getToken();
        const response = await fetch("https://backend.sigmoyd.in/general", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: message.trim() }),
        });
        const data = await response.json();

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === botMessageId
              ? { ...chat, message: data.response }
              : chat
          )
        );
      } catch (error) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === botMessageId
              ? {
                  ...chat,
                  message:
                    "Sorry, I couldn't process that request. Please try again.",
                }
              : chat
          )
        );
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
                <br />
                <button
                  onClick={() => setMessage(part.trim())}
                  className="message-list-button"
                >
                  {part.trim()}
                </button>
              </span>
            );
          });

        setChats((prevChats) => {
          const botIndex = prevChats.findIndex(
            (chat) => chat.id === botMessageId
          );

          if (botIndex !== -1) {
            return [
              ...prevChats.slice(0, botIndex),
              {
                id: botMessageId,
                message: <div>{formattedMessage}</div>,
                sender: "bot",
              },
              ...prevChats.slice(botIndex + 1),
            ];
          }

          return prevChats;
        });
      } else {
        try {
          setChats((prevChats) =>
            prevChats.map((chat) =>
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
            )
          );

          setQuestions([]);
          console.log("Q&A:", updatedQandA);
          await sendRefinedQuery(updatedQandA);

          setChats((prevChats) =>
            prevChats.filter((chat) => chat.id !== botMessageId)
          );
        } catch (error) {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === botMessageId
                ? {
                    ...chat,
                    message: "Error refining your query. Please try again.",
                  }
                : chat
            )
          );
        }
      }
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch("https://backend.sigmoyd.in/refine_query", {
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
                <button
                  onClick={() => setMessage(part.trim())}
                  className="message-list-button"
                >
                  {part.trim()}
                </button>
              </span>
            );
          });

        // <div>{mainText}</div>
        // <div className="option-buttons">
        //   {options.map((option, index) => (
        //     <button
        //       key={index}
        //       className="message-list-button"
        //       onClick={() => setMessage(option.trim())}
        //     >
        //       {option.trim()}
        //     </button>
        //   ))}
        // </div>
        setQuestions(data.response);
        setCurrentQuestionIndex(1);

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === botMessageId
              ? { ...chat, message: <div>{formattedMessage}</div> }
              : chat
          )
        );
      } else {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === botMessageId
              ? {
                  ...chat,
                  message:
                    "I don't have any clarifying questions. Would you like me to generate a workflow based on your query?",
                }
              : chat
          )
        );
      }
    } catch (error) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === botMessageId
            ? {
                ...chat,
                message:
                  "I encountered an error processing your request. Please try again.",
              }
            : chat
        )
      );
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
      const response = await fetch("https://backend.sigmoyd.in/refine_query", {
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
      setRefinedQuery(data.response);
      setChats([
        {
          id: (Date.now() + 2).toString(),
          message: "UPDATED QUERY :-",
          sender: "bot",
        },
      ]);
    } catch (error) {
      console.error("Error updating query:", error);
    }
  };

  const sendRefinedQuery = async (updatedQandA: QandA) => {
    try {
      const token = await getToken();
      const response = await fetch("https://backend.sigmoyd.in/refine_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: chats[0].message.trim(),
          flag: 1,
          question: updatedQandA,
        }),
      });
      const data = await response.json();
      setRefinedQuery(data.response);
    } catch (error) {
      console.error("Error sending refined query:", error);
      setChats([
        {
          id: Date.now().toString(),
          message:
            "I encountered an error refining your query. Please try again.",
          sender: "bot",
        },
      ]);
    }
  };

  const handleModeChange = (newMode: "workflow" | "general") => {
    if (mode !== newMode) {
      setMode(newMode);
      setChats([]);
      setMessage("");
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setQanda({});
      setRefinedQuery(null);
      setWorkflowJson(null);
      setShowWorkflow(false);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        "https://backend.sigmoyd.in/sidebar_workflows",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  const handleGenerateWorkflow = async (type: boolean) => {
    try {
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

      const response = await fetch("https://backend.sigmoyd.in/create_agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        mode: "cors",
        body: JSON.stringify({
          query: refinedQuery,
          flag: type ? 1 : 0,
          wid: showWorkflow ? workflowJson.workflow_id : "",
        }),
      });

      setLoading(false);
      setLoadingStep("");
      setLoadingProgress(0);
      setBootComplete(true);

      const data = await response.json();
      setWorkflowJson(data.response); // This now includes nodes_requiring_input
      fetchWorkflows();
      setCurrentWorkflow(data.response.workflow_id);
      setShowWorkflow(true);
    } catch (error) {
      console.error("Error generating workflow:", error);
      setLoading(false);
      setLoadingStep("");
      setLoadingProgress(0);
      setBootComplete(true);
    }
  };

  const handleNewChatClick = () => {
    setChats([]);
    setMessage("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setQanda({});
    setRefinedQuery(null);
    setWorkflowJson(null);
    setShowWorkflow(false);
    setCurrentWorkflow(null);

    setMode("workflow");
  };

  // Add state for workflow logs
  const [workflowLogs, setWorkflowLogs] = useState<LogMessage[]>([]);

  // Use the custom hook to connect to WebSocket and receive logs
  useWorkflowLogs((log: LogMessage) => {
    setWorkflowLogs((prevLogs) => [...prevLogs, log]);

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
                    {typeof value === "object" && value !== null
                      ? renderObjectValue(value)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      setChats((prevChats) => [
        ...prevChats,
        {
          id: Date.now().toString(),
          message: logMessage,
          sender: "bot",
          isLog: true,
          log_id: log.workflow_id,
        },
      ]);
    }
  });

  // Helper function to render object values
  const renderObjectValue = (obj: any): React.ReactNode => {
    // Check for null or undefined
    if (obj === null || obj === undefined) {
      return "null";
    }

    // Special handling for strings to prevent iteration over individual characters
    if (typeof obj === "string") {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return (
        <div className="pl-2 mt-1">
          {obj.map((item, index) => (
            <div key={`array-item-${index}`} className="mb-1">
              <span className="font-medium text-gray-400">[{index}]: </span>
              {typeof item === "object" && item !== null
                ? renderObjectValue(item)
                : String(item)}
            </div>
          ))}
        </div>
      );
    }

    // Handle object types (but not arrays, functions, dates, etc.)
    if (typeof obj === "object") {
      try {
        // Check if it's an object we can safely iterate over
        if (!obj.constructor || obj.constructor === Object) {
          const entries = Object.entries(obj);
          if (entries.length === 0) {
            return "{Empty Object}";
          }

          return (
            <div className="pl-2 mt-1">
              {entries.map(([key, value], idx) => (
                <div key={`obj-key-${key}-${idx}`} className="mb-1">
                  <span className="font-medium text-blue">{key}: </span>
                  {typeof value === "object" && value !== null
                    ? renderObjectValue(value)
                    : String(value)}
                </div>
              ))}
            </div>
          );
        } else {
          // For other object types that are not plain objects (like Date)
          return String(obj);
        }
      } catch (error) {
        return `{Error rendering object: ${error.message}}`;
      }
    }

    // For everything else, convert to string
    return String(obj);
  };

  // Handle making a workflow public
  const handleMakePublic = async (publicWorkflow: any) => {
    setShowPublicDialog(false);

    try {
      console.log("Making workflow public:", publicWorkflow);
      const token = await getToken();
      const response = await fetch(
        "https://backend.sigmoyd.in/public_workflow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workflowjson: publicWorkflow,
            refined_prompt: refinedQuery,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to make workflow public");
      }

      const responseData = await response.json();
      // // Update the workflows list
      // setWorkflows(prevWorkflows =>
      //   prevWorkflows.map(workflow =>
      //     workflow.id === responseData.json.workflow_id
      //       ? { ...workflow, public: true }
      //       : workflow
      //   )
      // );

      alert("Workflow has been made public successfully!");
    } catch (error) {
      console.error("Error making workflow public:", error);
      alert("Failed to make workflow public. Please try again.");
    }
  };

  // Utility function to transform messages with bullet points into interactive buttons
  const transformMessageWithButtons = (
    message: string | JSX.Element
  ): React.ReactNode => {
    // If message is already a JSX element, return it as is
    if (typeof message !== "string") {
      return message;
    }

    // Check if the message contains bullet points (asterisks)
    if (message.includes("* ")) {
      // Split the message into parts based on asterisks
      const parts = message.split("* ");

      // The first part is the main message text
      const mainText = parts[0];

      // The rest are options that should be buttons
      const options = parts.slice(1);

      return (
        <>
          <div>{mainText}</div>
          <div className="option-buttons">
            {options.map((option, index) => (
              <button
                key={index}
                className="message-list-button"
                onClick={() => setMessage(option.trim())}
              >
                {option.trim()}
              </button>
            ))}
          </div>
        </>
      );
    }

    // Return the original message if no bullet points
    return message;
  };

  // Add this function to scroll to the bottom of chat
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, []);

  // Remove the handleWorkflowUpdate function and use this approach instead
  const [graphKey, setGraphKey] = useState(0);

  // This function will be called when a node is clicked/edited
  const handleNodeClick = useCallback(() => {
    // Force re-render of the workflow graph by updating its key
    setGraphKey((prevKey) => prevKey + 1);
  }, []);

  // Add this effect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chats, scrollToBottom]);

  // Add this for smooth scrolling behavior in the component did mount
  useEffect(() => {
    // Set scroll behavior to smooth for the chat container
    if (chatContainerRef.current) {
      chatContainerRef.current.style.scrollBehavior = "smooth";
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Function to determine if we're on the home page
  const isHomePage = !showWorkflow && !currentWorkflow && chats.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] relative">
      {loading && (
        <div className="boot-overlay fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
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
                    <div
                      className={`boot-message ${
                        index === bootPhase ? "boot-cursor" : ""
                      }`}
                    >
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

      <div className="fixed top-0 left-0 right-0 z-50 bg-black">
        <TopBar
          onMenuClick={() => setShowSidebar(true)}
          onHomeClick={handleNewChatClick}
          onNewChatClick={handleNewChatClick}
          onPublicClick={
            currentWorkflow ? () => setShowPublicDialog(true) : undefined
          }
          sidebarVisible={showSidebar}
          currentWorkflow={
            currentWorkflowObject
              ? {
                  name: currentWorkflowObject.name,
                  id: currentWorkflowObject.id,
                  public: currentWorkflowObject.public || false,
                }
              : null
          }
          isHomePage={isHomePage} // Pass this new prop
        />
      </div>

      {/* Only render the Sidebar on the home page */}
      {isHomePage && (
        <Sidebar
          show={showSidebar}
          onClose={() => setShowSidebar(false)}
          onNewChatClick={handleNewChatClick}
          setWorkflowJson={setWorkflowJson}
          setRefinedQuery={setRefinedQuery}
          setShowWorkflow={setShowWorkflow}
          workflows={workflows}
          setWorkflows={setWorkflows}
          currentWorkflow={currentWorkflow}
          setCurrentWorkflow={setCurrentWorkflow}
        />
      )}

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
            <div className="chat-container" ref={chatContainerRef}>
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`message ${
                    chat.sender === "user"
                      ? "user-message"
                      : chat.isLog
                      ? "bot-message"
                      : "bot-message"
                  }`}
                >
                  {((workflowJson &&
                    workflowJson.workflow_id === chat.log_id) ||
                    !workflowJson) && (
                    <div className="message-content">
                      {transformMessageWithButtons(chat.message)}
                    </div>
                  )}
                  {chat.timestamp && (
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
                setRefinedQuery={setRefinedQuery}
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
        </div>

        {showWorkflow && workflowJson && (
          <div
            className={`transition-all duration-500 ease-in-out ${
              fullScreenWorkflow
                ? "w-full fixed left-0 right-0 top-0 bottom-0 z-0 pt-16"
                : "w-2/3 fixed right-0 top-0 bottom-0 z-0 pt-16"
            } pb-8 px-3 mx-auto`}
          >
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
              key={`${currentWorkflow}-${graphKey}`} // Add graphKey to force re-render
              workflowJson={workflowJson}
              workflows={workflows}
              setWorkflows={setWorkflows}
              setCurrentWorkflow={setCurrentWorkflow}
              currentWorkflow={currentWorkflow}
              onNodeClick={handleNodeClick} // Pass the node click handler
            />
          </div>
        )}
      </main>

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

      {/* Public Workflow Dialog */}
      {showPublicDialog && workflowJson && (
        <PublicDialogue
          isOpen={showPublicDialog}
          onClose={() => setShowPublicDialog(false)}
          workflowJson={workflowJson}
          onConfirm={handleMakePublic}
        />
      )}
    </div>
  );
}
