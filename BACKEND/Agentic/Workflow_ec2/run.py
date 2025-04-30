import importlib.util
import tempfile
import os
import json
import subprocess
from typing import Dict, Any

CUSTOM_TOOLS_FILE = "custom_tools.json"

class Tool:
    def __init__(self, tool_json: Dict[str, Any]):
        self.name = tool_json["name"]
        self.description = tool_json["description"]
        self.inputs = tool_json["inputs"]
        self.outputs = tool_json["outputs"]
        self.code = tool_json["code"]
        self.requirements = tool_json.get("requirements", [])
        self.function_name = self.name  # The function name is the same as tool name
        self.module_path = None
        
        self._install_requirements()
        self._create_module()
    
    def _install_requirements(self):
        if self.requirements:
            subprocess.run(["pip", "install"] + self.requirements, check=True)
    
    def _create_module(self):
        """Creates a temporary module file for execution."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".py") as temp_file:
            self.module_path = temp_file.name
            temp_file.write(self.code.encode())
    
    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Executes the function with the given inputs and returns the outputs."""
        if not self.module_path:
            raise RuntimeError("Module not loaded correctly.")
        
        spec = importlib.util.spec_from_file_location(self.name, self.module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        if not hasattr(module, self.function_name):
            raise AttributeError(f"Function {self.function_name} not found in the module.")
        
        func = getattr(module, self.function_name)
        result = func(**input_data)
        
        if not isinstance(result, dict):
            raise TypeError("Function must return a dictionary.")
        
        return {key: result[key] for key in self.outputs} if self.outputs else result
    
    def cleanup(self):
        """Deletes the temporary module file."""
        if self.module_path and os.path.exists(self.module_path):
            os.remove(self.module_path)






if __name__ == "__main__":

# Example usage
    tool_json = {
        "name": "create_page_in_page",
        "description": "create a notion page embedded in an already existing notion page",
        "inputs": [{"name": "parent_page_link", "type": "str"}],
        "outputs": [],
        "code": """
def create_page_in_page(parent_page_link):
    return {"status": "success", "parent": parent_page_link,"fuck":0}
    """,
        "requirements": ["numpy"]
    }

    # Instantiate and execute
    tool = Tool(tool_json)
    result = tool.execute({"parent_page_link": "https://notion.so/page"})
    print(result)  # Output: {'status': 'success', 'parent': 'https://notion.so/page'}
    tool.cleanup()
