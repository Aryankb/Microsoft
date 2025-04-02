import { useState } from "react";
// import { useNavigate } from 'react-router-dom';
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/python/python";
import "codemirror/theme/material.css";

export default function CreateToolPage() {
  // const navigate = useNavigate();

  const [toolName, setToolName] = useState("");
  const [description, setDescription] = useState("");
  const [inputs, setInputs] = useState([{ name: "", type: "" }]);
  const [outputs, setOutputs] = useState([""]);
  const [code, setCode] = useState(
    `def function():\n    return {"status": "success"}`
  );
  const [requirements, setRequirements] = useState("");

  // Add new input field
  const addInput = () => setInputs([...inputs, { name: "", type: "" }]);

  // Add new output field
  const addOutput = () => setOutputs([...outputs, ""]);

  // Save Tool Data (Replace with API Call)
  const saveTool = () => {
    const toolData = {
      name: toolName,
      description,
      inputs,
      outputs,
      code,
      requirements: requirements.split(",").map((req) => req.trim()), // Convert to array
    };
    console.log("Tool Data:", toolData); // ✅ Replace with API call
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-gray-800 text-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Create New Tool</h2>

      {/* Tool Name */}
      <label className="block text-sm mb-1">Tool Name</label>
      <input
        type="text"
        className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        value={toolName}
        onChange={(e) => setToolName(e.target.value)}
      />

      {/* Description */}
      <label className="block text-sm mt-4 mb-1">Description</label>
      <textarea
        className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Inputs */}
      <div className="mt-4">
        <label className="block text-sm mb-1">Inputs</label>
        {inputs.map((input, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Input Name"
              className="w-1/2 p-2 rounded bg-gray-700 border border-gray-600"
              value={input.name}
              onChange={(e) => {
                const newInputs = [...inputs];
                newInputs[index].name = e.target.value;
                setInputs(newInputs);
              }}
            />
            <input
              type="text"
              placeholder="Type"
              className="w-1/2 p-2 rounded bg-gray-700 border border-gray-600"
              value={input.type}
              onChange={(e) => {
                const newInputs = [...inputs];
                newInputs[index].type = e.target.value;
                setInputs(newInputs);
              }}
            />
          </div>
        ))}
        <button
          onClick={addInput}
          className="mt-2 bg-blue-500 px-3 py-1 rounded"
        >
          + Add Input
        </button>
      </div>

      {/* Outputs */}
      <div className="mt-4">
        <label className="block text-sm mb-1">Outputs</label>
        {outputs.map((output, index) => (
          <input
            key={index}
            type="text"
            placeholder="Output"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 mb-2"
            value={output}
            onChange={(e) => {
              const newOutputs = [...outputs];
              newOutputs[index] = e.target.value;
              setOutputs(newOutputs);
            }}
          />
        ))}
        <button
          onClick={addOutput}
          className="mt-2 bg-blue-500 px-3 py-1 rounded"
        >
          + Add Output
        </button>
      </div>

      {/* Python Code Editor */}
      <div className="mt-4">
        <label className="block text-sm mb-1">Python Code</label>
        <CodeMirror
          value={code}
          options={{ mode: "python", theme: "material", lineNumbers: true }}
          onBeforeChange={(editor, data, value) => setCode(value)}
        />
      </div>

      {/* Requirements */}
      <label className="block text-sm mt-4 mb-1">
        Requirements (comma-separated)
      </label>
      <input
        type="text"
        className="w-full p-2 rounded bg-gray-700 border border-gray-600"
        value={requirements}
        onChange={(e) => setRequirements(e.target.value)}
      />

      {/* Save Button */}
      <button
        onClick={saveTool}
        className="mt-4 bg-green-500 px-4 py-2 rounded"
      >
        Save Tool
      </button>
    </div>
  );
}
