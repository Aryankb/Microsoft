import React, { useState } from "react";
import { Handle } from "reactflow";
import { Dialog } from "./ui/dialog";
import { Tooltip } from "react-tooltip";
import {
  FileSpreadsheet,
  Mail,
  NotebookPen,
  Youtube,
  Linkedin,
  Calendar,
  FileText,
  FileIcon,
  AlarmCheck,
  BrainCircuit,
  IterationCcw,
  CheckSquare,
  Send,
  MousePointerClick,
  X,
  Twitter,
  Instagram,
  Facebook,
  MessageSquare,
  MessagesSquare,
  Database,
  Cloud,
  Code,
  Sparkles,
  Info,
} from "lucide-react";
import "./IconNode.css";
import CustomNode from "./CustomNode";

interface IconNodeProps {
  data: any;
}

const IconNode: React.FC<IconNodeProps> = ({ data }) => {
  const [open, setOpen] = useState(false);

  const getIconForService = () => {
    const label = data.label.toString().toUpperCase();

    if (label.includes("FILE_UPLOAD")) {
      return <FileIcon size={32} className="text-blue-300" />;
    } else if (label.includes("GOOGLESHEETS") || label.includes("GOOGLE SHEETS")) {
      return <FileSpreadsheet size={32} className="text-green-500" />;
    } else if (label.includes("GMAIL")) {
      return <Mail size={32} className="text-red-500" />;
    } else if (label.includes("NOTION")) {
      return <NotebookPen size={32} className="text-gray-100" />;
    } else if (label.includes("YOUTUBE")) {
      return <Youtube size={32} className="text-red-600" />;
    } else if (label.includes("LINKEDIN")) {
      return <Linkedin size={32} className="text-blue-500" />;
    } else if (label.includes("GOOGLECALENDAR") || label.includes("GOOGLE CALENDAR")) {
      return <Calendar size={32} className="text-blue-400" />;
    } else if (label.includes("GOOGLEDOCS") || label.includes("GOOGLE DOCS")) {
      return <FileText size={32} className="text-blue-500" />;
    } else if (label.includes("GOOGLEMEET") || label.includes("GOOGLE MEET")) {
      return <AlarmCheck size={32} className="text-green-400" />;
    } else if (label.includes("TWITTER") || label.includes("X")) {
      return <Twitter size={32} className="text-sky-400" />;
    } else if (label.includes("INSTAGRAM")) {
      return <Instagram size={32} className="text-pink-500" />;
    } else if (label.includes("FACEBOOK")) {
      return <Facebook size={32} className="text-blue-600" />;
    } else if (label.includes("SLACK")) {
      return <MessageSquare size={32} className="text-purple-500" />;
    } else if (label.includes("TEAMS")) {
      return <MessagesSquare size={32} className="text-indigo-400" />;
    } else if (label.includes("DATABASE")) {
      return <Database size={32} className="text-yellow-300" />;
    } else if (label.includes("CLOUD")) {
      return <Cloud size={32} className="text-sky-300" />;
    } else if (label.includes("ITERATOR")) {
      return <IterationCcw size={32} className="text-yellow-400" />;
    } else if (label.includes("VALIDATOR")) {
      return <CheckSquare size={32} className="text-purple-400" />;
    } else if (label.includes("DELEGATOR")) {
      return <Send size={32} className="text-blue-300" />;
    } else if (label.includes("GEMINI")) {
      return <Sparkles size={32} className="text-yellow-200" />;
    } else if (label.includes("API") || label.includes("CODE")) {
      return <Code size={32} className="text-green-300" />;
    } else if (data.type === "llm") {
      return <BrainCircuit size={32} className="text-cyan-400" />;
    } else {
      return <MousePointerClick size={32} className="text-gray-300" />;
    }
  };

  const getIconBackgroundColor = () => {
    const label = data.label.toString().toUpperCase();
    
    if (data.type === "llm") {
      return "bg-gradient-to-r from-cyan-900 to-blue-900";
    } else if (label.includes("GMAIL")) {
      return "bg-gradient-to-r from-red-900 to-red-800";
    } else if (label.includes("GOOGLESHEETS") || label.includes("GOOGLE SHEETS")) {
      return "bg-gradient-to-r from-green-900 to-green-800";
    } else if (label.includes("NOTION")) {
      return "bg-gradient-to-r from-gray-900 to-gray-800";
    } else if (label.includes("LINKEDIN")) {
      return "bg-gradient-to-r from-blue-900 to-blue-800";
    } else if (label.includes("YOUTUBE")) {
      return "bg-gradient-to-r from-red-900 to-rose-800";
    } else if (label.includes("TWITTER") || label.includes("X")) {
      return "bg-gradient-to-r from-sky-900 to-blue-800";
    } else if (label.includes("INSTAGRAM")) {
      return "bg-gradient-to-r from-pink-900 to-purple-800";
    } else if (label.includes("FACEBOOK")) {
      return "bg-gradient-to-r from-blue-900 to-indigo-800";
    } else if (label.includes("SLACK")) {
      return "bg-gradient-to-r from-purple-900 to-purple-800";
    } else if (label.includes("CLOUD")) {
      return "bg-gradient-to-r from-sky-900 to-blue-800";
    } else if (label.includes("VALIDATOR")) {
      return "bg-gradient-to-r from-purple-900 to-purple-800";
    } else if (label.includes("ITERATOR")) {
      return "bg-gradient-to-r from-yellow-900 to-amber-800";
    } else if (label.includes("DELEGATOR")) {
      return "bg-gradient-to-r from-blue-900 to-sky-800";
    } else if (label.includes("GEMINI")) {
      return "bg-gradient-to-r from-purple-800 to-blue-900";
    } else if (label.includes("API") || label.includes("CODE")) {
      return "bg-gradient-to-r from-emerald-900 to-green-800";
    } else {
      return "bg-gradient-to-r from-gray-800 to-gray-700";
    }
  };

  // Add this function to check if the node is a trigger
  const isTrigger = () => {
    return data.type === "trigger" || (data.id !== undefined && data.id === 0);
  };

  return (
    <>
      <div 
        className={`icon-node ${getIconBackgroundColor()} rounded-full shadow-lg cursor-pointer transition-all hover:scale-110 flex items-center justify-center border border-opacity-50 border-white relative`}
      >
        {/* Info icon with tooltip */}
        <div className="icon-info-tooltip" data-tooltip-id={`icon-tooltip-${data.id}`}>
          <Info size={10} className="icon-info-icon" />
        </div>
        <Tooltip id={`icon-tooltip-${data.id}`} place="top" effect="solid" className="icon-tooltip">
          <div className="icon-tooltip-content">
            <div className="tooltip-header">{data.label}</div>
            <div><strong>ID:</strong> {data.id}</div>
            <div><strong>Type:</strong> {data.type}</div>
            {data.description && <div><strong>Description:</strong> {data.description}</div>}
          </div>
        </Tooltip>

        <div className="icon-wrapper" onClick={() => setOpen(true)}>
          {getIconForService()}
        </div>
        
        {/* Add trigger indicator */}
        {isTrigger() && (
          <div className="trigger-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-1 -right-1">
              <circle cx="12" cy="12" r="10" fill="#3b82f6" />
              <path d="M12 6v8M8 10l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        
        {/* LLM indicator */}
        {data.type === "llm" && (
          <div className="llm-indicator">
            <div className="absolute -top-1 -left-1 bg-cyan-500 rounded-full w-4 h-4 flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
          </div>
        )}

        {data.to_execute && (
          <div className={`execution-mark-icon ${data.to_execute[1] === "Y" ? "bg-green-500" : "bg-red-500"}`}>
            {data.to_execute[1] === "Y" ? "1" : "2"}
          </div>
        )}
        <Handle type="target" position="top" className="handle-top" />
        <Handle type="source" position="bottom" className="handle-bottom" />
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        className="node-dialog"
      >
        <div className="node-dialog-content">
          <div className="node-dialog-header">
            <h2>{data.label}</h2>
            <button onClick={() => setOpen(false)} className="close-button">
              <X size={18} />
            </button>
          </div>
          <div className="node-dialog-body">
            <CustomNode data={data} />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default IconNode;
