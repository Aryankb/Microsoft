import { useState } from 'react';
import { Menu, Settings, Book, MessageSquare, Zap, Key, BarChart3, DollarSign } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

interface TopBarProps {
  onMenuClick: () => void;
}

const menuItems = [
  { icon: Key, label: 'Add Auth' },
  { icon: Zap, label: 'Your Triggers' },
  { icon: BarChart3, label: 'Workflow logs' },  
  
  { icon: Book, label: 'Documentation' },
  { icon: MessageSquare, label: 'Feedback' },
  { icon: DollarSign, label: 'Plans and Usage' },
  { icon: Settings, label: 'Your Collections' },
];

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { getToken } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTools, setAuthTools] = useState<{ [key: string]: boolean }>({});

  // ✅ Fetch User Auth Data
  const fetchUserAuths = async () => {
    try {
      const token = await getToken();
      const response = await fetch('http://127.0.0.1:8000/user_auths', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Auth Data:', data); // Debugging log
        setAuthTools(data);
        setAuthModalOpen(true);
      } else {
        console.error('Failed to fetch user auths');
      }
    } catch (error) {
      console.error('Error fetching user auths:', error);
    }
  };

  // ✅ Toggle Auth Status
  const handleAuthToggle = async (tool: string, enabled: boolean) => {
    try {
        const token = await getToken();
        const endpoint = enabled ? 'http://127.0.0.1:8000/auth' : 'http://127.0.0.1:8000/delete_auth';

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            redirect: 'manual', // Prevent automatic following
        });

        if (response.status === 200) {
          const authUrl = await response.json();
          console.log("Redirecting to:", authUrl.auth_url);
          // window.location.href = authUrl.auth_url; // Redirect use
          // window.location.assign(authUrl); // ✅ Forces a full page reload
          window.open(authUrl.auth_url, "_blank", "noopener,noreferrer"); // ✅ Opens in new tab

          return;
      }

        if (response.status==200) {
            setAuthTools(prev => ({ ...prev, [tool]: enabled }));
        } else {
            console.error(`Failed to update auth for ${tool}`);
        }
    } catch (error) {
        console.error(`Error updating auth for ${tool}:`, error);
    }
};






  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="p-2 hover:bg-gray-700 rounded">
              <Menu size={25} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="p-2 hover:bg-gray-700 rounded"
                title={item.label}
                onClick={item.label === 'Add Auth' ? fetchUserAuths : undefined} // ✅ Open Modal
              >
                <item.icon size={20} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Auth Modal */}
{authModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-lg font-semibold text-white mb-4">Manage Authentications</h2>

      <div className="space-y-3">
        {Object.entries(authTools).map(([tool, enabled]) => (
          <div key={tool} className="flex justify-between items-center text-white p-3 bg-gray-700 rounded-lg">
            <span className="text-lg">{tool.charAt(0).toUpperCase() + tool.slice(1)}</span>
            
            {/* ✅ Toggle Switch */}
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleAuthToggle(tool, !enabled)}
                className="sr-only peer"
              />
              <div
                className={`w-20 h-10 flex items-center rounded-full p-1 transition ${
                  enabled ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <span className={`text-sm text-white font-bold ml-2 ${enabled ? '' : 'opacity-50'}`}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
                <div
                  className={`w-8 h-8 bg-white rounded-full shadow-md transform transition ${
                    enabled ? 'translate-x-9' : 'translate-x-1'
                  }`}
                ></div>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  </div>


      )}
    </>
  );
}
