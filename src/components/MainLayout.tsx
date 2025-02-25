import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

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
  const [flag, setFlag] = useState(2);
  const [qanda, setQanda] = useState<QandA>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleSend = async () => {
    if (!message.trim()) return;

    if (flag === 2) setFlag(0);

    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const updatedQandA = [...qanda, { question: questions[currentQuestionIndex], answer: message.trim() }];
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
          { id: (Date.now() + 1).toString(), message: "All questions answered. Thank you!", sender: 'bot' }
        ]);
        setQuestions([]);
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
      const response = await fetch("https://2f90-117-250-161-222.ngrok-free.app/refine_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#171717] text-white">
      <TopBar onMenuClick={() => setShowSidebar(true)} />
      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />

      <main className="flex-1 flex flex-col items-center pt-20 pb-24 px-4">
        <div className="w-full max-w-2xl flex flex-col flex-grow overflow-hidden">
          <div className="flex flex-col flex-grow overflow-y-auto space-y-4 p-4">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-grow">
                <h1 className="text-3xl font-bold mb-4">SIGMOYD</h1>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Send a message..."
                  className="w-full max-w-xl bg-gray-700 rounded-lg px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
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
                  className={`max-w-[75%] px-4 py-3 rounded-lg ${chat.sender === 'user' ? 'ml-auto bg-blue-500' : 'mr-auto bg-gray-700'}`}
                >
                  {chat.message}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4">
        <div className="container mx-auto max-w-2xl flex gap-4 items-center">
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
      </div>
    </div>
  );
}
