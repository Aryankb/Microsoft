import { useState, useEffect, useRef } from "react";
("react");
import { Send } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@clerk/clerk-react";
import WorkflowGraph from "./WorkflowGraph.tsx";

const EXAMPLE_PROMPTS = [
  "Create a workflow for social media post scheduling",
  "Build an email automation workflow",
  "Design a customer onboarding workflow",
];

type ChatMessage = {
  id: string;
  message: string;
  sender: "user" | "bot";
};
interface Workflow {
  id: string;
  name: string;
  json: string;
  prompt: string;
  active?: boolean;
}
type QandA = {
  question: string;
  answer: string;
}[];

export default function MainLayout() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<"workflow" | "general">("workflow"); // New toggle state
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
  const refinedQueryRef = useRef<HTMLTextAreaElement>(null);

  // Function to auto-resize textarea based on content
  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    if (!element) return;

    // Reset height to measure content properly
    element.style.height = "auto";

    // Set height to scroll height to display all content
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    if (mode === "general") {
      // General Query Mode: Send directly to /general
      setChats([
        ...chats,
        { id: Date.now().toString(), message, sender: "user" },
        {
          id: (Date.now() + 1).toString(),
          message: "Fetching response...",
          sender: "bot",
        },
      ]);
      setMessage("");

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
            chat.message === "Fetching response..."
              ? { ...chat, message: data.response }
              : chat
          )
        );
      } catch (error) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.message === "Fetching response..."
              ? { ...chat, message: "Error fetching response" }
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
      setMessage("");

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

        setChats([
          ...chats,
          {
            id: Date.now().toString(),
            message: message.trim(),
            sender: "user",
          },
          {
            id: (Date.now() + 1).toString(),
            message: <div>{formattedMessage}</div>,
            sender: "bot",
          },
        ]);
      } else {
        setChats([
          ...chats,
          {
            id: Date.now().toString(),
            message: message.trim(),
            sender: "user",
          },
          {
            id: (Date.now() + 1).toString(),
            message: "Refining Query...",
            sender: "bot",
          },
        ]);
        setQuestions([]);
        console.log("Q&A:", updatedQandA);
        await sendRefinedQuery(updatedQandA);
      }
      return;
    }

    const newChats = [
      ...chats,
      { id: Date.now().toString(), message: message.trim(), sender: "user" },
      {
        id: (Date.now() + 1).toString(),
        message: "Thinking...",
        sender: "bot",
      },
    ];
    setChats(newChats);
    setMessage("");

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
        setChats([
          ...newChats,
          {
            id: (Date.now() + 2).toString(),
            message: <div>{formattedMessage}</div>,
            sender: "bot",
          },
        ]);
      } else {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.message === "Thinking..."
              ? {
                  ...chat,
                  message:
                    "No questions found. do you want to get refined query ?",
                }
              : chat
          )
        );
      }
    } catch (error) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.message === "Thinking..."
            ? { ...chat, message: "Error fetching response" }
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
      setChats([
        {
          id: (Date.now() + 2).toString(),
          message: "REFINED QUERY :-",
          sender: "bot",
        },
      ]);
    } catch (error) {
      console.error("Error sending refined query:", error);
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
      // setShowWorkflow(false);
      setWorkflowJson(data.response);
      fetchWorkflows();
      setCurrentWorkflow(data.response.workflow_id);
      setShowWorkflow(true);
    } catch (error) {
      console.error("Error generating workflow:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // No preventDefault when Shift+Enter is pressed, allowing new line
  };

  // Auto-resize textarea based on content
  const autoResizeMessageInput = (element: HTMLTextAreaElement) => {
    if (!element) return;
    element.style.height = "0";
    const newHeight = Math.min(element.scrollHeight, 200); // Max height of 200px
    element.style.height = `${newHeight}px`;
  };

  // Function to handle home button click
  const handleHomeClick = () => {
    // Reset the UI to the initial message input state
    setChats([]);
    setMessage("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setQanda({});
    setRefinedQuery(null);
    setWorkflowJson(null);
    setShowWorkflow(false);

    // Make sure we're in workflow mode by default
    setMode("workflow");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#171717] text-white pt-40 pb-24 px-4 gap-4 relative">
      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-lg">Generating workflow... Please wait</p>
        </div>
      )}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBar
          onMenuClick={() => setShowSidebar(true)}
          onHomeClick={handleHomeClick}
        />
      </div>

      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        setWorkflowJson={setWorkflowJson}
        setRefinedQuery={setRefinedQuery}
        setShowWorkflow={setShowWorkflow}
        workflows={workflows}
        setWorkflows={setWorkflows}
        currentWorkflow={currentWorkflow}
        setCurrentWorkflow={setCurrentWorkflow}
      />

      <main
        className={`flex-1 flex ${
          showWorkflow ? "flex-row" : "flex-col"
        } pt-20 pb-24 px-4 gap-4 relative`}
      >
        <div
          className={`${
            showWorkflow ? "w-1/3" : "w-full"
          } flex flex-col overflow-y-auto z-0`}
        >
          <div className="flex flex-col space-y-4">
            {chats.length === 0 && !showWorkflow ? (
              <div className="flex flex-col items-center justify-center flex-grow">
                <h1 className="text-3xl font-bold mb-4">SIGMOYD</h1>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => handleModeChange("workflow")}
                    className={`px-4 py-2 rounded ${
                      mode === "workflow" ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    Create Workflow
                  </button>
                  <button
                    onClick={() => handleModeChange("general")}
                    className={`px-4 py-2 rounded ${
                      mode === "general" ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    General Query
                  </button>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    autoResizeMessageInput(e.target);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      showWorkflow
                        ? handleQueryUpdate(message)
                        : handleKeyPress(e);
                    }
                  }}
                  placeholder="Send a message..."
                  className="w-full max-w-xl bg-gray-700 rounded-lg px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none overflow-y-auto"
                  style={{ minHeight: "56px", maxHeight: "200px" }}
                  rows={1}
                />
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
                </div>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`max-w-[75%] px-4 py-3 rounded-lg ${
                    chat.sender === "user"
                      ? "ml-auto bg-blue-500"
                      : "mr-auto bg-gray-700"
                  }`}
                >
                  {chat.message}
                </div>
              ))
            )}
          </div>
          {refinedQuery && (
            <div
              className="max-w-[75%] px-10 py-3 rounded-lg mr-auto bg-green-500 text-white cursor-pointer"
              onClick={(e) => {
                const input = e.currentTarget
                  .nextElementSibling as HTMLTextAreaElement;
                input.style.display = "block";
                input.focus();
                e.currentTarget.style.display = "none";

                // Auto-resize the textarea when displayed
                autoResizeTextarea(input);
              }}
            >
              {refinedQuery}
            </div>
          )}

          {refinedQuery && (
            <textarea
              ref={refinedQueryRef}
              value={refinedQuery}
              onBlur={(e) => {
                e.target.style.display = "none";
                e.target.previousElementSibling.style.display = "block";
                setRefinedQuery(e.target.value);
              }}
              onChange={(e) => {
                setRefinedQuery(e.target.value);
                // Auto-resize while typing
                autoResizeTextarea(e.target);
              }}
              onFocus={(e) => {
                // Ensure proper sizing when focused
                autoResizeTextarea(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const newValue = e.currentTarget.value + "\n";
                  setRefinedQuery(newValue);

                  // Let React update the value, then resize
                  setTimeout(() => autoResizeTextarea(e.currentTarget), 0);
                }
              }}
              className="px-4 py-3 border rounded-lg w-full max-w-[75%] mr-auto resize-none bg-gray-700 text-white"
              placeholder="Refined Query"
              style={{
                display: "none",
                minHeight: "40px",
                overflowY: "hidden", // Hide scrollbar when auto-sizing
              }}
            />
          )}

          {refinedQuery && (
            <div>
              <button
                onClick={() => {
                  const userChoice = showWorkflow
                    ? window.confirm(
                        "Cancel --> create new\nOK --> update existing"
                      )
                    : false;
                  console.log(userChoice);
                  handleGenerateWorkflow(userChoice);
                }}
                className="mt-4 px-4 py-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-all duration-200"
              >
                Generate Workflow
              </button>
            </div>
          )}
        </div>

        {showWorkflow &&
          workflowJson &&
          (console.log("in main layout:", workflowJson),
          (
            <div className="w-2/3 fixed right-0 top-0 bottom-0 z-0 pt-8 pb-8 px-3 mx-auto ">
              <WorkflowGraph
                key={JSON.stringify(workflowJson)}
                workflowJson={workflowJson}
                workflows={workflows}
                setWorkflows={setWorkflows}
                setCurrentWorkflow={setCurrentWorkflow}
                currentWorkflow={currentWorkflow}
              />
            </div>
          ))}
      </main>
      {(chats.length > 0 || showWorkflow) && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 z-49">
          <div className="container mx-auto max-w-3xl flex gap-4 items-center">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                autoResizeMessageInput(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  showWorkflow ? handleQueryUpdate(message) : handleKeyPress(e);
                }
              }}
              placeholder={
                showWorkflow ? "Update the workflow..." : "Send a message..."
              }
              className="flex-1 bg-gray-700 rounded-lg px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
              style={{ minHeight: "56px", maxHeight: "150px" }}
              rows={1}
            />
            <button
              onClick={() =>
                showWorkflow ? handleQueryUpdate(message) : handleSend()
              }
              disabled={!message.trim()}
              className="p-3 bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
