import { X } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuth, useUser, SignOutButton, UserButton } from '@clerk/clerk-react';

interface SidebarProps {
  show: boolean;
  onClose: () => void;
}

export default function Sidebar({ show, onClose }: SidebarProps) {
  const { workflows, setCurrentWorkflow, currentWorkflow } = useWorkflowStore();
  const { getToken, signOut } = useAuth();
  const { user } = useUser();

  const handleWorkflowClick = async (workflowId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/get_chat?workflowId=${workflowId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const chats = await response.json();
      setCurrentWorkflow(workflowId);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-50 ${
        show ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 h-full flex flex-col justify-between">
        {/* Workflows Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Workflows</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            {workflows.map((workflow) => (
              <button
                key={workflow.id}
                onClick={() => handleWorkflowClick(workflow.id)}
                className={`w-full text-left px-4 py-2 rounded ${
                  currentWorkflow === workflow.id ? 'bg-blue-500' : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      workflow.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  {workflow.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile and Logout Section */}
        <div className="border-t border-gray-600 pt-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <div>
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="text-xs text-gray-400">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          <SignOutButton>
            <button className="mt-3 w-full text-left px-4 py-2 bg-red-600 hover:bg-red-700 rounded">
              Logout
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
