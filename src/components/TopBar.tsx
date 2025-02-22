import { Menu, Settings, Book, MessageSquare, Zap, Key, BarChart3, DollarSign } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuth } from '@clerk/clerk-react';

interface TopBarProps {
  onMenuClick: () => void;
}

const menuItems = [
  { icon: Settings, label: 'Your Collections' },
  { icon: Zap, label: 'Your Triggers' },
  { icon: BarChart3, label: 'Active Workflows' },
  { icon: Key, label: 'Add Auth' },
  { icon: Book, label: 'Documentation' },
  { icon: MessageSquare, label: 'Feedback' },
  { icon: DollarSign, label: 'Plans and Usage' },
];

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { currentWorkflow, workflows, setWorkflowStatus, renameWorkflow } = useWorkflowStore();
  const currentWorkflowData = workflows.find(w => w.id === currentWorkflow);
  const { getToken } = useAuth();

  const handleStatusToggle = async () => {
    if (!currentWorkflow) return;
    
    try {
      const token = await getToken();
      const endpoint = currentWorkflowData?.isActive ? '/workflow_stop' : '/workflow_start';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workflowId: currentWorkflow }),
      });
      
      if (response.ok) {
        setWorkflowStatus(currentWorkflow, !currentWorkflowData?.isActive);
      }
    } catch (error) {
      console.error('Error toggling workflow status:', error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <Menu size={24} />
          </button>
          
          {currentWorkflowData && (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={currentWorkflowData.name}
                onChange={(e) => renameWorkflow(currentWorkflow!, e.target.value)}
                className="bg-transparent border-b border-transparent hover:border-gray-600 focus:border-blue-500 px-2 py-1 outline-none"
              />
              <button
                onClick={handleStatusToggle}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600"
              >
                <div className={`w-2 h-2 rounded-full ${currentWorkflowData.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                {currentWorkflowData.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="p-2 hover:bg-gray-700 rounded group relative"
              title={item.label}
            >
              <item.icon size={20} />
              <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}