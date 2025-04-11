import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@clerk/clerk-react";
import WorkflowGraph from "./WorkflowGraph.tsx";
import ChatInterface from "./ChatInterface";
import QueryRefiner from "./QueryRefiner";
import VanishingMessageInput from "./VanishingMessageInput";
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
};

interface Workflow {
  id: string;
  name: string;
  json: string;
  prompt: string;
  active?: boolean;
  unavailable:string
}

type QandA = {
  question: string;
  answer: string;
}[];

export default function MainLayout() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<"workflow" | "general">("workflow");
  const [flag, setFlag] = useState(2);
  const [qanda, setQanda] = useState<{ [key: string]: string }>({});
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { getToken } = useAuth();
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

  // const [unavailable,setUnavailable]=useState(null);
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
        const response = await fetch("http://localhost:8000/general", {
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
      const response = await fetch("http://localhost:8000/refine_query", {
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

      // setChats([
      //   {
      //     id: Date.now().toString(),
      //     message: (
      //       <div className="refined-query">
      //         <span className="refined-query-header">
      //           I've refined your query:
      //         </span>
      //         <div className="refined-query-content">{data.response}</div>
      //       </div>
      //     ),
      //     sender: "bot",
      //   },
      // ]);
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
      const response = await fetch("http://localhost:8000/sidebar_workflows", {
        headers: { Authorization: `Bearer ${token}` },
      });

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

      document.documentElement.classList.add("workflow-loading");

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

      const response = await fetch("http://localhost:8000/create_agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: refinedQuery,
          flag: type ? 1 : 0,
          wid: showWorkflow ? workflowJson.workflow_id : "",
        }),
      });

      const data = await response.json();
      setWorkflowJson(data.response);
      console.log("workflowjson",workflowJson);
      fetchWorkflows();
      setCurrentWorkflow(data.response.workflow_id);
      setShowWorkflow(true);
      // setUnavailable(data.unavailable);
      // Ensure loading animation is cleared once we have the workflow data
      // regardless of the boot animation state
      setLoading(false);
      setLoadingStep("");
      setLoadingProgress(0);
      document.documentElement.classList.remove("workflow-loading");
      setBootComplete(true); // Ensure boot animation doesn't continue
    } catch (error) {
      console.error("Error generating workflow:", error);
      // Make sure to clean up animation in case of error
      setLoading(false);
      setLoadingStep("");
      setLoadingProgress(0);
      document.documentElement.classList.remove("workflow-loading");
    } finally {
      // This is now just a backup cleanup
      // The animation should already be cleared in the success case
      if (!bootComplete) {
        const checkBootComplete = setInterval(() => {
          if (bootComplete) {
            clearInterval(checkBootComplete);
            setLoading(false);
            setLoadingStep("");
            setLoadingProgress(0);
            document.documentElement.classList.remove("workflow-loading");
          } else {
            // Force cleanup after 15 seconds as a safeguard
            setTimeout(() => {
              clearInterval(checkBootComplete);
              setLoading(false);
              setLoadingStep("");
              setLoadingProgress(0);
              document.documentElement.classList.remove("workflow-loading");
            }, 15000);
          }
        }, 100);
      }
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

    setMode("workflow");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] relative">
      {loading && (
        <div className="boot-overlay">
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
          onNewChatClick={handleNewChatClick}
          sidebarVisible={showSidebar}
        />
      </div>

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

      <main className="flex flex-1 pt-16 pb-24 relative">
        <div
          className={`flex flex-col ${
            showWorkflow
              ? "w-1/3  border-gray-700 bg-[var(--color-background)] z-10"
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
                    chat.sender === "user" ? "user-message" : "bot-message"
                  }`}
                >
                  <div className="message-content">{chat.message}</div>
                </div>
              ))}
            </div>
          )}


          {refinedQuery && (
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
          <div className="w-2/3 fixed right-0 top-0 bottom-0 z-0 pt-8 pb-8 px-3 mx-auto">
            <WorkflowGraph
              key={JSON.stringify(workflowJson)}
              workflowJson={workflowJson}
              workflows={workflows}
              setWorkflows={setWorkflows}
              setCurrentWorkflow={setCurrentWorkflow}
              currentWorkflow={currentWorkflow}
            />
          </div>
        )}
      </main>

      {/* Add padding at the bottom to prevent content being hidden under the input */}
      <div className="input-spacer"></div>

      {/* Message Input Area with CSS classes */}
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
