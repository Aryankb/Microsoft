import { create } from 'zustand';

interface WorkflowState {
  workflows: Array<{
    id: string;
    name: string;
    isActive: boolean;
    chats: Array<{
      id: string;
      message: string;
      timestamp: number;
    }>;
  }>;
  currentWorkflow: string | null;
  addWorkflow: (name: string) => void;
  setWorkflowStatus: (id: string, isActive: boolean) => void;
  addChat: (workflowId: string, message: string) => void;
  setCurrentWorkflow: (id: string) => void;
  renameWorkflow: (id: string, newName: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],
  currentWorkflow: null,
  addWorkflow: (name) =>
    set((state) => ({
      workflows: [
        ...state.workflows,
        { id: Date.now().toString(), name, isActive: false, chats: [] },
      ],
    })),
  setWorkflowStatus: (id, isActive) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id ? { ...w, isActive } : w
      ),
    })),
  addChat: (workflowId, message) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              chats: [
                ...w.chats,
                { id: Date.now().toString(), message, timestamp: Date.now() },
              ],
            }
          : w
      ),
    })),
  setCurrentWorkflow: (id) => set({ currentWorkflow: id }),
  renameWorkflow: (id, newName) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id ? { ...w, name: newName } : w
      ),
    })),
}));