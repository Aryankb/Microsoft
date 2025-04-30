
from composio import Composio , ComposioToolSet , Action , App
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain import hub
from langchain_google_genai import ChatGoogleGenerativeAI
import composio_langchain
import requests
import json
import re
import datetime
import pytz
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import requests
import zipfile
import io
import os
import re
import time
import google.generativeai as genai
from pathlib import Path
from google.generativeai.types import HarmCategory, HarmBlockThreshold
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash",google_api_key="AIzaSyBxtMRRQPVj6ViJqWl_SfcLuIP0-cwtCTQ")  
prompt = hub.pull("hwchase17/openai-functions-agent")




class NOTION():
    def __init__(self, api_key,kwargs):
        self.kwargs = kwargs            # dictionary
        self.tool_set = ComposioToolSet(api_key= api_key)
        self.prompt_toolset = composio_langchain.ComposioToolSet(api_key=api_key)
 
        
    def NOTION_CREATE_PAGE_IN_PAGE(self,parent_page_link="url for noton page",page_title="title of new page"):

        
        match = re.search(r'[^-]+$', parent_page_link)

        if match:
            print(match.group())
        id=match.group()[:8]+"-"+match.group()[8:12]+"-"+match.group()[12:16]+"-"+match.group()[16:20]+"-"+match.group()[20:]
        print(id)
        rret=self.tool_set.execute_action(
        action="NOTION_CREATE_NOTION_PAGE",
        params={"parent_id": id, "title": page_title},
        )
        return {
            "status":rret["successfull"],
            "new_page_url":rret["data"]["data"]["url"]
        }
       
  
    
    def NOTION_ADD_ONE_CONTENT_BLOCK_IN_PAGE(self,parent_page_link="url for noton page",content_block="content to add",block_property="paragraph/heading_1/bulleted_list_item"):
        match = re.search(r'[^-]+$', parent_page_link)

        if match:
            print(match.group())
        id=match.group()[:8]+"-"+match.group()[8:12]+"-"+match.group()[12:16]+"-"+match.group()[16:20]+"-"+match.group()[20:]
        print(id)
        # return self.tool_set.execute_action(
        # action="NOTION_ADD_PAGE_CONTENT",
        # params={"parent_block_id": match.group(), "content_block": content_block},
        # )
        task=f"""
        parent_block_id : {id} 
        content : {content_block}
        block_property : {block_property}
 please format the  above information in the required input format
        """
        tools = self.prompt_toolset.get_tools(actions=['NOTION_ADD_PAGE_CONTENT'])
        agent = create_openai_functions_agent(llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        result = agent_executor.invoke({"input": task})
        return {
            "status":result["output"],
        }
#(e.g., paragraph, heading_1, heading_2, heading_3, callout, todo, toggle, quote, bulleted_list_item, numbered_list_item, file, image, video)
#block_property, bold, code, color, content, italic, link, strikethrough, and underline.


    # def notion_create_database(self,parent_page_link="url for noton page",title="title of database",properties=[{'name': 'Task Name', 'type': 'title'}, {'name': 'Due Date', 'type': 'date'}]):

        
    #     match = re.search(r'[^-]+$', parent_page_link)

    #     if match:
    #         print(match.group())

    #     return self.tool_set.execute_action(
    #     action="NOTION_CREATE_DATABASE",
    #     params={"parent_id": match.group(), "title": title, "properties": properties},
    #     )
    






    # exta details inserting ? on opening the row page
    def NOTION_INSERT_ROW_DATABASE(self,parent_page_link="notion page url in which database exists (important)",database_name="title of notion database (important)",**row_content):
        print(row_content,parent_page_link,database_name)
        match = re.search(r'[^-]+$', parent_page_link)

        if match:
            print(match.group())
        id=match.group()[:8]+"-"+match.group()[8:12]+"-"+match.group()[12:16]+"-"+match.group()[16:20]+"-"+match.group()[20:]
        print(id)
        blocks=self.tool_set.execute_action(
        action="NOTION_FETCH_NOTION_CHILD_BLOCK",
        params={"block_id": id},
        )   



        # extracting database id
        print(blocks)   
        db_id=None
        if blocks["successfull"]==True:
            for block in blocks["data"]["block_child_data"]["results"]:
                if block["type"]=="child_database" and block["child_database"]["title"]==database_name:
                    db_id=block["id"]
                    break
  
            if db_id==None:
                return {"successful":False,"error":"Database not found"}

            else:
                
                # getting properties of database (schema)

                properties= self.tool_set.execute_action(
                action="NOTION_FETCH_DATABASE",
                params={"database_id": db_id},
                )["data"]["response_data"]["properties"]
                print(type(properties))

                prop_nam_typ=[{properties[prop]["name"]:properties[prop]["type"]} for prop in properties]

                task=f'''
                properties schema (type for each property):- {prop_nam_typ}\nSTRICTLY FOLLOW THE ABOVE SCHEMA AND EXTRACT INFORMATION FRM THE ROW CONTENT SUCH THAT IT FOLLOWS THE SCHEMA\n
                db id :- {db_id}\n
                row content to insert :- {row_content}
                if anything missing, then keep it empty

                '''
                print(task)
                tools = self.prompt_toolset.get_tools(actions=['NOTION_INSERT_ROW_DATABASE'])
                agent = create_openai_functions_agent(llm, tools, prompt)
                agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
                result = agent_executor.invoke({"input": task})
                print(result)
                return {
                    "status":result["output"],
                }
        else:

            return {
                "status":blocks["successfull"],
            }






    def execute(self):                       #LLM will only call execute
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")
        
    



        

# add content nicely
# block, block children
# NOTION_QUERY_DATABASE
# NOTION_FETCH_ROW
# NOTION_UPDATE_ROW_DATABASE
# unresolved comment
# create comment





# GMAIL_SEND_EMAIL
# GMAIL_FETCH_EMAILS
# GMAIL_GET_ATTACHMENT
# GMAIL_CREATE_EMAIL_DRAFT
# GMAIL_ADD_LABEL_TO_EMAIL
# GMAIL_REPLY_TO_THREAD
# GMAIL_CREATE_LABEL
# GMAIL_LIST_THREADS                      ---   not added  !
# GMAIL_REMOVE_LABEL







class GITHUB:
    def __init__(self, api_key=None, kwargs={}):
        self.api_key = api_key
        self.kwargs = kwargs
        self.tool_set = ComposioToolSet(api_key= api_key)
        self.prompt_toolset = composio_langchain.ComposioToolSet(api_key=api_key)

    def execute(self):
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")

        # if action == "download_and_extract_repo":
        #     owner = self.kwargs["owner"]
        #     repo = self.kwargs["repo"]
        #     ref = self.kwargs["ref"]
        #     extract_to = self.kwargs.get("extract_to", "extracted_repo")
        #     return self.download_and_extract_repo(owner, repo, ref, extract_to)

        # elif action == "list_github_issues":
        #     return self.list_github_issues(self.api_key)

        # else:
        #     raise ValueError(f"Unsupported action: {action}")

    def download_and_extract_repo(self, owner, repo, ref="branch", extract_to="extracted_repo"):
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        url = f"https://api.github.com/repos/{owner}/{repo}/zipball/{ref}"
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            with zipfile.ZipFile(io.BytesIO(response.content)) as zip_ref:
                zip_ref.extractall(extract_to)
            subfolder = next((p for p in os.listdir(extract_to) if os.path.isdir(os.path.join(extract_to, p))), None)
            full_path = os.path.join(extract_to, subfolder)
            print(f"Repo extracted to '{full_path}/'")
            return full_path
        else:
            raise Exception(f"Failed to download repo: {response.status_code} - {response.text}")

    def list_github_issues(self):
        composio_toolset = ComposioToolSet(self.api_key)
        return composio_toolset.execute_action(
            action="GITHUB_LIST_ISSUES_ASSIGNED_TO_THE_AUTHENTICATED_USER",
            params={}
        )










SUPPORTED_EXTENSIONS = {'.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c'}

class CODE_SUMMARY:
    def __init__(self, api_key=None, kwargs={}):
        self.api_key = api_key
        self.kwargs = kwargs
        self.tool_set = ComposioToolSet(api_key= api_key)
        self.prompt_toolset = composio_langchain.ComposioToolSet(api_key=api_key)

    

    def extract_code_chunks(self, code, language):
        if language == "python":
            pattern = re.compile(r"^(def |class ).+", re.MULTILINE)
        elif language in {"javascript", "typescript"}:
            pattern = re.compile(r"^(function |const |let |class ).+", re.MULTILINE)
        else:
            pattern = re.compile(r"^.+", re.MULTILINE)

        matches = list(pattern.finditer(code))
        chunks = []

        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i+1].start() if i+1 < len(matches) else len(code)
            chunk = code[start:end].strip()
            line_start = code[:start].count("\n") + 1
            line_end = code[:end].count("\n") + 1
            if chunk:
                chunks.append((chunk, line_start, line_end))
        return chunks

    def summarise_code(self, code_chunk, model):
        prompt = (
            "You're an expert developer. "
            "Summarise the functionality of the following code snippet in clear, natural language for documentation purposes and be descriptive:\n\n"
            f"{code_chunk}\n\n"
            "Be brief but informative, and do not miss anything."
        )
        try:
            response = model.generate_content([prompt], 
        safety_settings={
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        })
            return response.text.strip()
        except Exception as e:
            print(f"LLM error: {e}")
            return "Summary unavailable."

    def summarise_codebase(self, root_folder, rate_limit=30, output_file="json_path_containing_summarized_code_chunks"):
        root_folder = root_folder.rstrip("/") + "/"
        genai.configure(api_key="AIzaSyBxtMRRQPVj6ViJqWl_SfcLuIP0-cwtCTQ")
        model = genai.GenerativeModel("gemini-2.0-flash-lite")

        all_summaries = []
        chunk_count = 0
        start_time = time.time()

        for filepath in Path(root_folder).rglob("*"):
            if filepath.suffix in SUPPORTED_EXTENSIONS:
                try:
                    code = filepath.read_text(encoding="utf-8", errors="ignore")
                    ext = filepath.suffix
                    language = (
                        "python" if ext == ".py"
                        else "javascript" if ext in [".js", ".ts", ".tsx", ".jsx"]
                        else "cpp"
                    )
                    chunks = self.extract_code_chunks(code, language)

                    for chunk, start, end in chunks:
                        chunk_count += 1
                        if chunk_count % rate_limit == 0:
                            elapsed = time.time() - start_time
                            time.sleep(max(0, 60 - elapsed))
                            start_time = time.time()

                        explanation = self.summarise_code(chunk, model)
                        all_summaries.append({
                            "file": str(filepath.relative_to(root_folder)),
                            "lines": f"{start}-{end}",
                            "summary": explanation
                        })

                except Exception as e:
                    print(f"Error parsing {filepath}: {e}")

        output_path = Path(output_file).resolve()
        with open(output_path, "w", encoding="utf-8") as wb:
            json.dump(all_summaries, wb, indent=2)

        print(f"Summary saved to: {output_path}")
        return str(output_path)
    

    def execute(self):
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")







import os
import time
import json
import numpy as np
import faiss


class VECTORISER:
    def __init__(self, api_key=None, kwargs={}):
        self.api_key = api_key
        self.kwargs = kwargs
        self.tool_set = ComposioToolSet(api_key= api_key)
        self.prompt_toolset = composio_langchain.ComposioToolSet(api_key=api_key)

    

    def get_embedding(self, text):
        try:
            response = genai.embed_content(
                model="models/gemini-embedding-exp-03-07",
                content=text,
                task_type="RETRIEVAL_DOCUMENT",
                title="Code Summary"
            )
            return response['embedding']
        except Exception as e:
            print(f"Embedding failed: {e}")
            return None

    def embed_chunks_with_limit(self, summaries, delay=12):
        embedded_chunks = []
        for idx, entry in enumerate(summaries):
            print(f"Embedding {idx + 1}/{len(summaries)}: {entry['file']}")
            embedding = self.get_embedding(entry["summary"])
            if embedding:
                embedded_chunks.append({**entry, "embedding": embedding})
            else:
                print(f"Skipping chunk {idx+1}")
            time.sleep(delay)
        return embedded_chunks

    def save_embeddings(self, embedded_chunks, index_path="code_chunks.index", metadata_path="code_chunks_metadata.json"):
        vectors = np.array([x["embedding"] for x in embedded_chunks]).astype("float32")
        if vectors.size > 0:
            index = faiss.IndexFlatL2(len(vectors[0]))
            index.add(vectors)
            faiss.write_index(index, index_path)
            with open(metadata_path, "w") as f:
                json.dump([{k: v for k, v in x.items() if k != "embedding"} for x in embedded_chunks], f, indent=2)
            print("FAISS index and metadata saved.")
            return {"vector_db_path":index_path,"metadata_json_path":metadata_path}
        else:
            print("No valid vectors to save.")
            return None

    def vectorise_codebase(self, summaries_json="output path of summary json", delay=12, index_path="path of vector database (.index) file", metadata_path="json_path_containing_metadata_of_summarized_code"):
        genai.configure(api_key="AIzaSyBxtMRRQPVj6ViJqWl_SfcLuIP0-cwtCTQ")
        with open(summaries_json) as f:
            summaries = json.load(f)
        embedded_chunks = self.embed_chunks_with_limit(summaries, delay=delay)
        return self.save_embeddings(embedded_chunks, index_path, metadata_path)


    def execute(self):
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")







class VECTORQUERY:
    def __init__(self, api_key=None, kwargs={}):
        self.api_key = api_key
        self.kwargs = kwargs
        self.tool_set = ComposioToolSet(api_key= api_key)
        self.prompt_toolset = composio_langchain.ComposioToolSet(api_key=api_key)

    def execute(self):
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")

    def load_index_and_metadata(self, index_path, metadata_path):
        genai.configure(api_key="AIzaSyBxtMRRQPVj6ViJqWl_SfcLuIP0-cwtCTQ")
        index = faiss.read_index(index_path)
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        return index, metadata

    def get_similar_chunks(self):
        index_path = self.kwargs["index_path"]
        metadata_path = self.kwargs["metadata_path"]
        query = self.kwargs["query"]
        top_k = self.kwargs.get("top_k", 3)

        try:
            index, metadata = self.load_index_and_metadata(index_path, metadata_path)
            response = genai.embed_content(
                model="models/gemini-embedding-exp-03-07",
                content=query,
                task_type="RETRIEVAL_QUERY"
            )
            embedding = np.array(response['embedding'], dtype="float32").reshape(1, -1)
            _, indices = index.search(embedding, top_k)
            return [metadata[i] for i in indices[0]]
        except Exception as e:
            return f"Similarity search failed: {e}"

    def answer_question(self,user_question,index_path="path of vector database (.index) file", metadata_path="json_path_containing_metadata_of_summarized_code"):
        

        try:
            index, metadata = self.load_index_and_metadata(index_path, metadata_path)

            response = genai.embed_content(
                model="models/gemini-embedding-exp-03-07",
                content=user_question,
                task_type="RETRIEVAL_QUERY"
            )
            embedding = np.array(response['embedding'], dtype="float32").reshape(1, -1)
            _, indices = index.search(embedding, 3)
            chunks = [metadata[i] for i in indices[0]]

            if not chunks:
                return "No relevant code found."

            context = "\n\n".join(
                f"File: {c['file']} (lines {c['lines']})\nSummary: {c['summary']}" for c in chunks
            )

            prompt = f"""You are a coding assistant. Use the following summaries to answer the question:

{context}

Question: {user_question}
Answer:"""

            model = genai.GenerativeModel("gemini-2.0-flash")
            return model.generate_content(prompt).text
        except Exception as e:
            return f"Failed to generate answer: {e}"






class GMAIL:
    def __init__(self, api_key, kwargs):
        self.api_key = api_key
        self.kwargs = kwargs
        self.tool_set = ComposioToolSet(api_key= api_key)
        self.prompt_toolset = composio_langchain.ComposioToolSet(api_key=api_key)

    def GMAIL_SEND_EMAIL(self, subject, body, is_html=False,  recipient_email="One email address",attachment="file_local_path"):
        # get attachment from user's collection - file name
        # temporary save to directory ram, and pass the path to the function
        if attachment=="file_local_path":
            return self.tool_set.execute_action(
                action="GMAIL_SEND_EMAIL",
                params={"recipient_email": recipient_email, "subject": subject, "body": body, "is_html": is_html},
            )
        return self.tool_set.execute_action(
            action="GMAIL_SEND_EMAIL",
            params={"recipient_email": recipient_email, "subject": subject, "body": body, "is_html": is_html, "attachment": attachment},
        )
        # delete the attachment file from the directory

    # def GMAIL_SEARCH_EMAIL(self, query, date_after=None, date_before=None,labels=[]):
    #     pass

    def GMAIL_CREATE_EMAIL_DRAFT(self, subject, body, recipient_email="One email address", is_html=False, attachment="file_local_path"):
        if attachment=="file_local_path":
            return self.execute_action(
                action="GMAIL_CREATE_EMAIL_DRAFT",
                params={"recipient_email": recipient_email, "subject": subject, "body": body, "is_html": is_html},
            )
        else:
            return self.tool_set.execute_action(
                action="GMAIL_CREATE_EMAIL_DRAFT",
                params={"recipient_email": recipient_email, "subject": subject, "body": body, "is_html": is_html, "attachment": attachment},
            )

    # def GMAIL_REPLY_TO_THREAD(self, thread_id, message_body, attachment="file_local_path"):
    #     pass

    # def GMAIL_CREATE_LABEL(self, label_name):
    #     pass

    # def GMAIL_REMOVE_LABEL(self, label_name, message_id):
    #     pass
    def execute(self):                       #LLM will only call execute
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")
   
class GOOGLESHEETS:
    def __init__(self, api_key,kwargs):
        self.api_key = api_key
        self.kwargs=kwargs
    def GOOGLESHEETS_GET_SHEET_ROWS(self,url:str='this is the url of the sheet',spreadsheet_name:str='this is the name of the sub sheet'):
        pass

    def GOOGLESHEETS_INSERT_ROW(self,url:str='this is the url of the sheet',spreadsheet_name:str='this is the name of the sub sheet'):
        pass

class GOOGLEDRIVE:
    def __init__(self, api_key,kwargs):
        self.api_key = api_key
        self.kwargs=kwargs
    
    def GOOGLEDRIVE_GET_FILE_CONTENT_FROM_URL(self,url:str='this is the url of the file'):
        pass

class LINKEDIN:
    def __init__(self, api_key, kwargs):
        self.api_key = api_key
        self.kwargs = kwargs


    def CREATE_LINKEDIN_POST(self , post_content , is_resharable = True):
        toolset = ComposioToolSet(api_key=self.api_key)
        linkedin_internal = LINKEDIN(api_key=self.api_key, kwargs={"action": "linkedin_get_my_info"})
        result_internal = linkedin_internal.execute()
        author_id = result_internal['data']['response_dict']['author_id']
        return {"state":toolset.execute_action(
            action=Action.LINKEDIN_CREATE_LINKED_IN_POST,
            params={
                "author" : author_id,
                "commentary" : post_content,
                "visibility" : "PUBLIC",
                "lifecycleState" : "PUBLISHED",
                "isReshareDisabledByAuthor" : is_resharable
            },
        )["successfull"]}




    def LINKEDIN_JOBS_SEARCH(self, query="linkedin search query", pages=1):
        url = "https://api.scrapingdog.com/linkedinjobs/"
        params = {
            "api_key": self.api_key,
            "field": query,
            "geoid": "102713980",
            "page1234567": pages
        }

        response = requests.get(url, params=params)

        if response.status_code == 200:
            data = response.json()
            extracted_data = [
                {
                    "job_id": item.get("job_id"),
                    "job_position": item.get("job_position"),
                    "company_name": item.get("company_name"),
                    "company_profile": item.get("company_profile"),
                    "job_location": item.get("job_location"),
                    "job_posting_date": item.get("job_posting_date"),
                    "job_link": item.get("job_link"),
                    "company_logo_url": item.get("company_logo_url")
                }
                for item in data
            ]
            return extracted_data
        else:
            return []


    def LINKEDIN_GET_PECIFIC_JOB_INFO(self, query="job title", pages=1, limit=5):
        result = self.linkedin_search(query=query, pages=pages)
        all_responses = []

        for x in range(min(limit, len(result))):
            url = "https://api.scrapingdog.com/linkedinjobs"
            api_key = self.api_key
            job_id = result[x]['job_id']
            params = {
                "api_key": api_key,
                "job_id": job_id
            }
            response = requests.get(url, params=params)

            if response.status_code == 200:
                try:
                    job_data = response.json()

                    # If API returns a list, take the first dictionary
                    if isinstance(job_data, list) and job_data:
                        job_data = job_data[0]  # Extract the first job result

                    if isinstance(job_data, dict):
                        required_details = {
                            "job_position": job_data.get("job_position"),
                            "job_location": job_data.get("job_location"),
                            "company_name": job_data.get("company_name"),
                            "company_linkedin_id": job_data.get("company_linkedin_id"),
                            "job_posting_time": job_data.get("job_posting_time"),
                            "job_description": job_data.get("job_description"),
                            "Seniority_level": job_data.get("Seniority_level"),
                            "Employment_type": job_data.get("Employment_type"),
                            "Job_function": job_data.get("Job_function"),
                            "Industries": job_data.get("Industries"),
                            "job_apply_link": job_data.get("job_apply_link"),
                            "recruiter_details": job_data.get("recruiter_details", [])
                        }
                        all_responses.append(required_details)
                    else:
                        all_responses.append({"error": "Unexpected response format", "job_id": job_id})

                except json.JSONDecodeError:
                    all_responses.append({"error": "Invalid JSON response", "job_id": job_id})
            else:
                all_responses.append({
                    "error": f"Request failed with status code {response.status_code}",
                    "job_id": job_id
                })

        return all_responses
    
    def LINKEDIN_GET_RECRUITER_EMAILS(self,job_title,quantity=10):
        driver = webdriver.Chrome()
        driver.get(f"https://www.linkedin.com/search/results/content/?keywords=%22hiring%22%20%26%20%22requirement%22%20%26%20%22job%22%20%26%20%22{job_title}%22&origin=GLOBAL_SEARCH_HEADER&sid=E_J")

        # Login to LinkedIn (Manually recommended for 2FA)
        username = driver.find_element(By.ID, "username")
        password = driver.find_element(By.ID, "password")
        wait = WebDriverWait(driver, 10)
        username.send_keys("aryankumarbaghel468@gmail.com")
        password.send_keys("6;HGUk+#=H3cd*9")
        password.send_keys(Keys.RETURN)

        time.sleep(5)  # Wait for login to complete

        # # Go to LinkedIn search and enter a query
        # search_query = "Data Science"
        # search_box = driver.find_element(By.CSS_SELECTOR, "input[placeholder='Search']")
        # search_box.send_keys(search_query)
        # search_box.send_keys(Keys.RETURN)

        # time.sleep(5)  # Wait for search results

        # # Click on 'Posts' filter
        # driver.get(driver.current_url + "&type=posts")
        # time.sleep(5)

        # # Scroll down to load more posts
        # for _ in range(3):  # Adjust the range for more results
        #     driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        #     time.sleep(3)

        # # Extract post contents
        # posts = driver.find_elements(By.CSS_SELECTOR, ".feed-shared-update-v2__description")

        # for index, post in enumerate(posts[:10]):  # Get first 10 posts
        #     print(f"Post {index + 1}: {post.text}\n")

        # driver.quit()

        ## Wait for home page to load
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(3)

        # Click the search bar to activate it
        search_button = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "search-global-typeahead__collapsed-search-button")))
        search_button.click()

        # Wait for search input to appear
        search_box = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input.search-global-typeahead__input")))
        search_box.send_keys("Data Science")
        search_box.send_keys(Keys.RETURN)

        # Wait for results to load
        time.sleep(5)

        # Click on "Posts" filter inside search-reusables__filter-pills-button
        # try:
        #     posts_filter = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(@class, 'search-reusables__filter-pills-button') and contains(., '\"Posts\"')]")))
        #     driver.execute_script("arguments[0].click();", posts_filter)  # Ensures click works
        #     print("✅ Clicked on 'Posts' filter inside search-reusables__filter-pills-button.")
        # except:
        #     print("⚠️ Could not click on 'Posts' filter inside search-reusables__filter-pills-button.")
        # Click on 'Posts' filter
        driver.get(driver.current_url + "&type=posts")
        # time.sleep(5)
        # Wait for posts to load
        time.sleep(5)

        # Scroll down multiple times to load more posts
        for _ in range(5):  
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)

        # Expand all "See more" buttons to get full posts
        see_more_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'more')]")
        for button in see_more_buttons:
            try:
                driver.execute_script("arguments[0].click();", button)
                time.sleep(1)  # Give time to expand
            except:
                pass  # Ignore if already expanded

        # Extract full post contents
        posts = driver.find_elements(By.CSS_SELECTOR, ".feed-shared-update-v2__description")
        to_ret=[]
        for index, post in enumerate(posts[:quantity]):  
            print(f"\n🔹 Post {index + 1}:\n{post.text}\n{'-'*50}")
            to_ret.append(post.text)

        driver.quit()
        return to_ret

    def execute(self):
        action = self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")
from dateutil.parser import parse


class GOOGLECALENDAR:
    
    def __init__(self,api_key,kwargs):
        self.api_key = api_key
        self.kwargs=kwargs
    @staticmethod
    def convert_to_ist(utc_str: str) -> str:
        utc_str = utc_str.rstrip('Z')
        utc_dt = parse(utc_str)
        utc_dt = pytz.utc.localize(utc_dt)
        ist = pytz.timezone('Asia/Kolkata')
        ist_dt = utc_dt.astimezone(ist)
        return ist_dt.isoformat()
    @staticmethod
    def find_free_slots(time_min: str, time_max: str, busy_slots: dict) -> list:
        # Convert input strings to datetime objects
        start_time = parse(time_min.rstrip('Z'))
        end_time = parse(time_max.rstrip('Z'))
        
        # Convert busy slots to sorted list of tuples
        busy_periods = []
        for slot in busy_slots.values():
            busy_start = parse(slot['start'].replace('+05:30', ''))
            busy_end = parse(slot['end'].replace('+05:30', ''))
            busy_periods.append((busy_start, busy_end))
        
        # Sort busy periods by start time
        busy_periods.sort(key=lambda x: x[0])
        
        # Find free slots
        free_slots = []
        current_time = start_time
        
        # Check if there are any busy periods
        if not busy_periods:
            free_slots.append({
                'start': start_time.isoformat(),
                'end': end_time.isoformat()
            })
            return free_slots
        
        # Iterate through busy periods to find gaps
        for busy_start, busy_end in busy_periods:
            # If there's a gap between current time and busy start, it's a free slot
            if current_time < busy_start:
                free_slots.append({
                    'start': current_time.isoformat(),
                    'end': busy_start.isoformat()
                })
            current_time = max(current_time, busy_end)
        
        # Add final free slot if there's time after last busy slot
        if current_time < end_time:
            free_slots.append({
                'start': current_time.isoformat(),
                'end': end_time.isoformat()
            })
        
        return free_slots
    
    def GOOGLECALENDAR_CREATE_EVENT(self , description:str='this is the description of the event',start_datetime:str='this is the start time of the event',event_duration_hour:int='this is the duration of the event in hours',event_duration_minutes:int='this is the duration of the event in minutes'):
        composio_toolset = ComposioToolSet(api_key=self.api_key)  
        params={"description":description,"start_datetime":start_datetime,"event_duration_hour":event_duration_hour,"event_duration_minutes":event_duration_minutes}  
        response=composio_toolset.execute_action(params=params,action = 'GOOGLECALENDAR_CREATE_EVENT' )
        if response['successfull']==True:
            return{'response':response['successfull']}
        else:
            return {'response':response['successfull']}

    def GOOGLECALENDAR_FIND_FREE_SLOTS(self,time_min:str='this is the start time of the event',time_max:str='this is the end time of the event'):
        composio_toolset = ComposioToolSet(api_key=self.api_key)
        params={"time_min":time_min,"time_max":time_max}
        response=composio_toolset.execute_action(params=params,action = 'GOOGLECALENDAR_FIND_FREE_SLOTS' )
        busy=response['data']['response_data']['calendars']['primary']['busy']
        busy_slots={}
        k=0
        for i in busy:
            busy_slots[k]={'start':self.convert_to_ist(i['start']),'end':self.convert_to_ist(i['end'])}
            k=k+1
        print("busy :",busy_slots)
        free_slots=self.find_free_slots(time_min,time_max,busy_slots)
        #     busy_slots[i]={'start':busy[i]['event']['event_data'][0]['start']['dateTime'],'end':busy[i]['event']['event_data'][0]['end']['dateTime']}
        # # if busy_slots[0]['start']:
        return free_slots
    def execute(self):                       #LLM will only call execute
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")



class GOOGLEDOCS:
    
    def __init__(self,api_key,kwargs):
        self.api_key = api_key
        self.kwargs=kwargs
    @staticmethod
    def get_id_from_url(url):
        match = re.search(r'/d/([a-zA-Z0-9_-]+)/', url)
        return match.group(1) if match else None      
    def GOOGLEDOCS_CREATE_DOCUMENT(self,title:str='this is the title of the document',text:str='this is the text of the document'):
        param={"title":title,"text":text}
        composio_toolset = ComposioToolSet(api_key=self.api_key)
        
        
        response=composio_toolset.execute_action(params=param,action = 'GOOGLEDOCS_CREATE_DOCUMENT' )
        return {'success': response['successfull']}


    def GOOGLEDOCS_UPDATE_EXISTING_DOCUMENT(self,document_url:str='this is the url of the document',editDocs:str='this is the text that you want to edit in the document'):
        response=self.GOOGLEDOCS_GET_DOCUMENT_BY_URL(document_url)
        end_index_data=response['data']['response_data']['body']['content'][-1]
        end_index=end_index_data['endIndex']
        document_id=self.get_id_from_url(document_url)
        editdocs_content=[
                            {
                                "deleteContentRange": {
                                "range": {
                                    "startIndex": 1,
                                    "endIndex": end_index-1
                                }
                                }
                            },
                            {
                                "insertText": {
                                "text": editDocs,
                                "location": {
                                    "index": 1
                                }
                                }
                            }
                        ]


        param={"document_id":document_id,"editDocs":editdocs_content}
        composio_toolset = ComposioToolSet(api_key=self.api_key)
        response=composio_toolset.execute_action(params=param,action = 'GOOGLEDOCS_UPDATE_EXISTING_DOCUMENT' )
        print(response)
        return {'success':response['successfull']}
         
    def GOOGLEDOCS_GET_DOCUMENT_BY_URL(self,url:str='this is the url of the document'):
        id=self.get_id_from_url(url)
        param={"id":id}
        composio_toolset = ComposioToolSet(api_key=self.api_key)
        response=composio_toolset.execute_action(params=param,action = 'GOOGLEDOCS_GET_DOCUMENT_BY_ID' )
        content=response['data']['response_data']['body']['content']
        data=""
        for i in content:
            print(i)
            if i==0:
                pass
            else:
                try:
                    data=data+i['paragraph']['elements'][0]['textRun']['content']+"\n"
                except:
                    pass


        #print(response)
        return {'data':data}
    def execute(self):                       #LLM will only call execute
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")



class YOUTUBE:
    def __init__(self, api_key,kwargs):
        self.api_key = api_key
        self.kwargs = kwargs

    def YOUTUBESEARCH(self, query, max_results=10, search_type="video"):
        toolset = ComposioToolSet(api_key=self.api_key, entity_id="default")
        data = toolset.execute_action(
            action=Action.YOUTUBE_SEARCH_YOU_TUBE,
            params={"q": query, "part": "snippet", "maxResults": max_results, "type": search_type},
            entity_id="default"
        )

        items = data.get("data", {}).get("response_data", {}).get("items", [])
        extracted_data = {
            "status_code": 200,
            "data": [
                {
                    "video_id": item.get("id", {}).get("videoId"),
                    "channel_id": item.get("snippet", {}).get("channelId"),
                    "title": item.get("snippet", {}).get("title"),
                    "description": item.get("snippet", {}).get("description"),
                    "video_link": f"https://www.youtube.com/watch?v={item.get('id', {}).get('videoId')}",
                    "publishedAt": item.get("snippet", {}).get("publishedAt"),
                    "channelTitle": item.get("snippet", {}).get("channelTitle"),
                    "thumbnail": item.get("snippet", {}).get("thumbnails", {}).get("high", {}).get("url"),
                }
                for item in items
            ]
        }
        return json.dumps(extracted_data, indent=4)

    def YOUTUBEVIDEODETAILS(self, video_id):
        toolset = ComposioToolSet(api_key=self.api_key)
        data = toolset.execute_action(
            action=Action.YOUTUBE_VIDEO_DETAILS,
            params={"id": video_id, "part": "snippet,contentDetails,statistics"},
        )

        items = data.get("data", {}).get("response_data", {}).get("items", [])
        extracted_data = {
            "status_code": 200,
            "data": [
                {
                    "id": item.get("id"),
                    "title": item.get("snippet", {}).get("title"),
                    "description": item.get("snippet", {}).get("description"),
                    "video_link": f"https://www.youtube.com/watch?v={item.get('id')}",
                    "publishedAt": item.get("snippet", {}).get("publishedAt"),
                    "channelTitle": item.get("snippet", {}).get("channelTitle"),
                    "thumbnail": item.get("snippet", {}).get("thumbnails", {}).get("high", {}).get("url"),
                    "duration": item.get("contentDetails", {}).get("duration"),
                    "viewCount": item.get("statistics", {}).get("viewCount"),
                    "likeCount": item.get("statistics", {}).get("likeCount"),
                    "commentCount": item.get("statistics", {}).get("commentCount"),
                }
                for item in items
            ]
        }
        return json.dumps(extracted_data, indent=4)

    def YOUTUBELISTUSERSUBSCRIPTIONS(self, max_results=10):
        toolset = ComposioToolSet(api_key=self.api_key, entity_id="default")
        data = toolset.execute_action(
            action=Action.YOUTUBE_LIST_USER_SUBSCRIPTIONS,
            params={"part": "snippet,contentDetails", "maxResults": max_results},
            entity_id="default",
        )

        items = data.get("data", {}).get("response_data", {}).get("items", [])
        extracted_data = {
            "status_code": 200,
            "data": [
                {
                    "subscription_id": item.get("id"),
                    "title": item.get("snippet", {}).get("title"),
                    "description": item.get("snippet", {}).get("description"),
                    "channel_id": item.get("snippet", {}).get("resourceId", {}).get("channelId"),
                    "publishedAt": item.get("snippet", {}).get("publishedAt"),
                    "thumbnail": item.get("snippet", {}).get("thumbnails", {}).get("high", {}).get("url"),
                    "totalItemCount": item.get("contentDetails", {}).get("totalItemCount"),
                    "newItemCount": item.get("contentDetails", {}).get("newItemCount"),
                    "activityType": item.get("contentDetails", {}).get("activityType"),
                }
                for item in items
            ]
        }
        return json.dumps(extracted_data, indent=4)

    def YOUTUBELISTUSERPLAYLISTS(self, max_results=10):
        toolset = ComposioToolSet(api_key=self.api_key)
        response = toolset.execute_action(
            action=Action.YOUTUBE_LIST_USER_PLAYLISTS,
            params={"part": "snippet", "maxResults": max_results},
        )

        if response.get("successfull") and response.get("data"):
            playlists = response["data"].get("response_data", {}).get("items", [])
            useful_data = [
                {
                    "id": playlist["id"],
                    "title": playlist["snippet"]["title"],
                    "description": playlist["snippet"]["description"],
                    "thumbnail": playlist["snippet"]["thumbnails"].get("high", {}).get("url"),
                }
                for playlist in playlists
            ]
            return json.dumps(useful_data, indent=4)

        return json.dumps([])

    def YOUTUBESUBSCRIBECHANNEL(self, channel_id):
        toolset = ComposioToolSet(api_key=self.api_key)
        return json.dumps(toolset.execute_action(
            action=Action.YOUTUBE_SUBSCRIBE_CHANNEL,
            params={"channelId": channel_id},
        ), indent=4)

    def connect_youtube(self):
        toolset = ComposioToolSet(api_key=self.api_key)
        connection_request = toolset.initiate_connection(entity_id="default", app=App.YOUTUBE)
        return json.dumps({"redirect_url": connection_request.redirectUrl}, indent=4)

    def execute(self):
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")
            



class GOOGLEMEET:
    
    def __init__(self,api_key,kwargs):
        self.api_key = api_key
        self.kwargs=kwargs
        

    def GOOGLEMEET_CREATE_MEET(self,start_datetime:str='this is the start time of the meeting and always in the format of (YYYY-MM-DDTHH:MM:SS)',event_duration_hour:int='this is the duration of the meeting in hours (integer)'):
        param={"start_datetime":start_datetime,"create_meeting_room":True,"event_duration_hour":event_duration_hour}
        composio_toolset = ComposioToolSet(api_key=self.api_key)     
        response=composio_toolset.execute_action(params=param,action = 'GOOGLECALENDAR_CREATE_EVENT' )
        return response['data']['response_data']['hangoutLink']
        
        
            

    def GOOGLEMEET_GET_CONFERENCE_RECORD_FOR_MEET(self,meeting_code:str="The meeting code of the Google Meet space"):
        params={"meeting_code":meeting_code}
        composio_toolset = ComposioToolSet(api_key=self.api_key)
        response=composio_toolset.execute_action(params=params,action = 'GOOGLEMEET_GET_TRANSCRIPTS_BY_CONFERENCE_RECORD_ID' )
        return response['data']
    def execute(self):                       #LLM will only call execute
        action=self.kwargs["action"]
        del self.kwargs["action"]
        
        if hasattr(self, action):  # Check if function exists
            return getattr(self, action)(**self.kwargs)  # Call the function dynamically
        else:
            return print(f"Method {action} not found")
            


# test_cases = [
#     {"action": "connect_youtube"},
#     {"action": "youtube_search", "query": "react native", "max_results": 2, "search_type": "video"},
#     {"action": "video_details", "video_id": "gvkqT_Uoahw"},
#     {"action": "list_user_subscriptions", "max_results": 2},
#     {"action": "list_user_playlists", "max_results": 5},
#     {"action": "subscribe_channel", "channel_id": "UCxaW7zwRupQmHvRTVpi10PA"},
# ]

# api_key = "8o15k780p434dhgxyrdjs"
# youtube = Youtube(api_key=api_key)

# for test in test_cases:
#     action = test.pop("action")  
#     try:
#         result = youtube.execute(action, **test)
#         print(f"Test case {action}:", result)
#     except Exception as e:
#         print(f"Error in test case {action}: {e}")
#     print("---")









#TESTING
if __name__ == "__main__":
    # gmail_obj = gmail(api_key="8o15k780p434dhgxyrdjs", kwargs={"action": "gmail_send_email", "recipient_email": "

    noti=NOTION(api_key="fyvn2yln306o052h5mt007",kwargs={"action":"notion_add_one_content_block_in_page","parent_page_link":"https://www.notion.so/Cybersecurity-14e8ba1b17ac8068ab2cc7bb86c634d0","content_block":"hiiii i love you","block_property":"bulleted_list_item"})
    get=noti.execute()
    print(get)



# instance = MyClass()
# func_name = "my_method"

# # Get method reference from the instance
# method = getattr(instance, func_name)

# # Get the signature of the method
# signature = inspect.signature(method)

# # Extract parameters with default values (or None if no default)
# inputs = {name: param.default if param.default is not inspect.Parameter.empty else None
#           for name, param in signature.parameters.items()}