import pandas as pd
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from dotenv import load_dotenv
import os
import inspect
from PyPDF2 import PdfReader
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

def CSV_AI(query: str, csv_path: str="path of one csv file"):
    # Load the CSV to inspect columns
    if csv_path.endswith('.xlsx'):
        df = pd.read_excel(csv_path)
    else:
        df = pd.read_csv(csv_path)
    columns = df.columns.tolist()
    
    # Get sample data for each column
    sample_data = {col: df[col].dropna().unique()[:5].tolist() for col in columns}
    
    # Determine if this is an update query
    is_update_query = any(keyword in query.lower() for keyword in [
        "update", "change", "modify", "replace", "set", "edit", "make", "extract", "filter", 
        "remove", "delete", "add", "insert", "append", "create", "generate", "transform",
        "convert", "find", "select", "where", "sort"
    ])
    
    # Construct the prompt for the LLM
    prompt = f"""
    Given a CSV file with the following column names and sample values (note: these are just examples and not the complete dataset):
    
    Column names: {columns}
    Sample data: {sample_data}
    
    Write Python pandas code to answer this query: "{query}"
    
    Your code MUST:
    1. First read the complete CSV file from '{csv_path}'
    2. Perform the required operations on the full dataset
    3. Store the final answer in a variable named 'result'
    
    The code should be structured as follows:
    ```
    # Read the complete dataset
    df = pd.read_csv('{csv_path}') if not '{csv_path}'.endswith('.xlsx') else pd.read_excel('{csv_path}')
    
    # Your data processing code here
    
    # Store the answer in the result variable
    result = ...
    ```
    
    Return only executable Python code with no explanations, comments are allowed.
    """
    
    # Add specific instructions for update queries
    if is_update_query:
        new_csv_path = csv_path.replace(".csv", "_updated.csv")
        prompt += f"""
        This appears to be an update query. After making the requested changes to the dataframe:
        1. Save the modified dataframe to a new CSV file at '{new_csv_path}'
        2. The 'result' variable should be a string that explains what was updated AND includes the path of the new CSV file.
        """
    else:
        prompt += """
        The final answer should be a string with explanation of the result.
        """
    
    print(f"Prompt sent to LLM:\n{prompt}")
    
    # Send to LLM
    response = model.generate_content(
        [prompt], 
        safety_settings={
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
    )
    
    # Extract the generated code
    code = response.text
    # Remove code blocks if they exist
    if "```python" in code:
        code = code.split("```python")[1].split("```")[0].strip()
    elif "```" in code:
        code = code.split("```")[1].split("```")[0].strip()
    
    print(f"Generated code:\n{code}")
    
    # Execute the code safely
    local_vars = {"pd": pd, "csv_path": csv_path}
    try:
        exec(code, {"pd": pd}, local_vars)
        # Print intermediate values to debug
        print("Variables after execution:", local_vars.keys())
        return local_vars.get("result")
    except Exception as e:
        print(f"Error executing code: {e}")
        return None




def TEXT_INPUT(text:str):
    return text


def FILE_UPLOAD(local_file_paths="list of file paths (path starts with uuid)"):
    # Check if input is a string starting with '[' and convert to list if needed
    if isinstance(local_file_paths, str) and local_file_paths.startswith('['):
        try:
            # Strip brackets and split by comma
            cleaned = local_file_paths.strip('[]').split(',')
            # Clean up each path
            local_file_paths = [path.strip().strip('"\'') for path in cleaned]
        except Exception as e:
            print(f"Error converting string to list: {e}")
    return local_file_paths


def PDF_TO_TEXT(pdf_paths: str = "list of pdf file paths (path starts with uuid)"):
    final=""
    # Read the PDF file
    try:
        for path in pdf_paths:
            reader = PdfReader(path)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            final+=text+"\n"
        return final
    except Exception as e:
        print(f"Error reading PDF file: {e}")
        return None


def CSV_READER(csv_path: str = "path of one csv file"):
    # Load the CSV file and convert to list of JSON objects (dictionaries)
    try:
        if csv_path.endswith('.xlsx'):
            df = pd.read_excel(csv_path)
        else:
            df = pd.read_csv(csv_path)
        
        # Convert DataFrame to list of dictionaries (each dict represents a row)
        rows_as_json = df.to_dict(orient='records')
        return rows_as_json
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return None


if __name__ == "__main__":
    
    
    # result = CSV_AI("what is the total profit of togo for all products", "/home/aryan/b2b/files/1000 Sales Records (1).csv")
    # print(result)
    # print(FILE_UPLOAD(**{"file1": "/path/to/file1.txt", "file2": "/path/to/file2.txt", "file3": "/path/to/file3.txt"}))
    # standalone_function = globals()["FILE_UPLOAD"]
                        
    # # Get function signature
    # signature = inspect.signature(standalone_function)
    # inputs = [{name: param.default if param.default is not inspect.Parameter.empty else None}
    #             for name, param in signature.parameters.items()]
    
    # print(inputs)
    result = CSV_AI("what is the total COST", "/home/aryan/BABLU/Agentic/8757175d-f9bc-4248-a8f6-3f09f60edd3a_aws_cost_model_by_users.csv")
    print(result)