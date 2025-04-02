import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@clerk/clerk-react";
import WorkflowGraph from "./WorkflowGraph.tsx";
import ChatInterface from "./ChatInterface";
import QueryRefiner from "./QueryRefiner";
import VanishingMessageInput from "./VanishingMessageInput.jsx";

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

  // Function to handle home/new chat button click
  const handleNewChatClick = () => {
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
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] relative">
      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[var(--color-primary)]"></div>
          <p className="mt-4 text-lg">Generating workflow... Please wait</p>
        </div>
      )}

      {/* Top Navigation Bar with black background */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black">
        <TopBar
          onMenuClick={() => setShowSidebar(true)}
          onNewChatClick={handleNewChatClick}
          sidebarVisible={showSidebar}
        />
      </div>

      {/* Sidebar */}
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

      {/* Main Content Area */}
      <main className="flex flex-1 pt-16 pb-24 relative">
        {/* Chat and Query Section */}
        <div
          className={`flex flex-col ${
            showWorkflow
              ? "w-1/3 border-r border-gray-700 bg-[var(--color-background)] z-10"
              : "w-full max-w-4xl mx-auto"
          } px-4 pt-4 overflow-y-auto min-h-full`}
        >
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
        </div>

        {/* Workflow Graph Section */}
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

      {/* Input Bar */}
      {(chats.length > 0 || showWorkflow) && (
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-card)] border-t border-gray-700 p-4 z-[100]">
          <div
            className={`mx-auto ${
              showWorkflow ? "pl-[calc(100%/3)] pr-4" : "max-w-3xl"
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
