import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";

// Define log message interface
export interface LogMessage {
    workflow_id: string;
    node: string;
    agent_name: string;
    status: string;
    timestamp: string;
    data: any;
}

// Custom hook to manage WebSocket connection
// Custom hook
export const useWorkflowLogs = (onLogReceived: (log: LogMessage) => void) => {
    const [connected, setConnected] = useState(false);
    const { getToken } = useAuth();
    const wsRef = useRef<WebSocket | null>(null);
    const onLogRef = useRef(onLogReceived);

    // Update ref if callback changes (keeps it stable)
    useEffect(() => {
        onLogRef.current = onLogReceived;
    }, [onLogReceived]);

    useEffect(() => {
        const connectWebSocket = async () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                return;
            }

            try {
                const token = await getToken();
                const ws = new WebSocket(`wss://backend.sigmoyd.in/ws/?token=${token}`);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log("✅ WebSocket connected");
                    setConnected(true);
                };

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log("📡 Workflow update:", data);
                    // Use stable ref
                    onLogRef.current(data);
                };

                ws.onclose = () => {
                    console.log("❌ WebSocket disconnected");
                    setConnected(false);
                };

                ws.onerror = (error) => {
                    console.error("⚠️ WebSocket error:", error);
                    setConnected(false);
                };
            } catch (error) {
                console.error("Failed to connect to WebSocket:", error);
            }
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [getToken]);

    return { connected };
};


// Main component
const FetchLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogMessage[]>([]);

    useWorkflowLogs((log) => {
        setLogs((prevLogs) => [...prevLogs, log]);
    });

    return (
        // <div>
        //     <h2>Refined Query</h2>
        //     <h3>Logs</h3>
        //     <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
        //         {logs.length > 0 ? (
        //             logs.map((log, index) => (
        //                 <div key={index} style={{ marginBottom: "10px" }}>
        //                     <strong>Timestamp:</strong> {log.timestamp} <br />
        //                     <strong>Workflow ID:</strong> {log.workflow_id} <br />
        //                     <strong>Node:</strong> {log.node} <br />
        //                     <strong>Agent Name:</strong> {log.agent_name} <br />
        //                     <strong>Status:</strong> {log.status} <br />
        //                     <strong>Data:</strong> {JSON.stringify(log.data, null, 2)}
        //                 </div>
        //             ))
        //         ) : (
        //             <p>No logs available</p>
        //         )}
        //     </div>
        // </div>
        <div></div>
    );
};

export default FetchLogs;
