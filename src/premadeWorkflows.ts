import { v4 as uuidv4 } from 'uuid'; // You might need to install this package

// This interface should match the Workflow interface in Sidebar.tsx
interface Workflow {
  id: string;
  name: string;
  json: string;
  prompt: string;
  active?: boolean;
  public?: boolean;
}

// Sample premade workflows that users can start with
export const PremadeWorkflows: Workflow[] = [
  {
    id: uuidv4(),
    name: "Basic Research Workflow",
    json: JSON.stringify({
      nodes: [
        {
          id: "1",
          type: "search",
          position: { x: 100, y: 100 },
          data: { label: "Web Search" }
        },
        {
          id: "2",
          type: "process",
          position: { x: 100, y: 200 },
          data: { label: "Process Results" }
        }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' }
      ]
    }),
    prompt: "Tell me about [topic]",
    active: true,
    public: true
  },
  {
    id: uuidv4(),
    name: "Comparison Analysis",
    json: JSON.stringify({
      nodes: [
        {
          id: "1",
          type: "input",
          position: { x: 100, y: 100 },
          data: { label: "User Query" }
        },
        {
          id: "2",
          type: "search",
          position: { x: 200, y: 200 },
          data: { label: "Research Item 1" }
        },
        {
          id: "3",
          type: "search",
          position: { x: 400, y: 200 },
          data: { label: "Research Item 2" }
        },
        {
          id: "4",
          type: "compare",
          position: { x: 300, y: 300 },
          data: { label: "Compare Results" }
        }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4' },
        { id: 'e3-4', source: '3', target: '4' }
      ]
    }),
    prompt: "Compare [item1] and [item2]",
    active: true,
    public: true
  }
];

export default PremadeWorkflows;
