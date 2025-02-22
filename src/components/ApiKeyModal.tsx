import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

interface ApiKeyModalProps {
  show: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ show, onClose }: ApiKeyModalProps) {
  const [keys, setKeys] = useState({
    openai: '',
    gemini: '',
    composio: '',
  });
  const { getToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const response = await fetch('/save_api_keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(keys),
      });
      
      if (response.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">API Keys Required</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={keys.openai}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Gemini API Key
            </label>
            <input
              type="password"
              value={keys.gemini}
              onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Composio API Key
            </label>
            <input
              type="password"
              value={keys.composio}
              onChange={(e) => setKeys({ ...keys, composio: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white rounded py-2 hover:bg-blue-600 transition-colors"
          >
            Save Keys
          </button>
        </form>
      </div>
    </div>
  );
}