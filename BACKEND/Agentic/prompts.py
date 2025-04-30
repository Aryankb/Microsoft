from langchain_google_genai import ChatGoogleGenerativeAI
from groq import Groq
from langchain_core.prompts import ChatPromptTemplate
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
from dotenv import load_dotenv
load_dotenv()

groq = Groq()

model = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    google_api_key=os.getenv("GOOGLE_API_KEY")
    # other params...
)


# 8. location : start the workflow when a user reaches a specific location. Inputs : location_name
#github_issue_added, youtube_video_upload, google_form_submission,from_chrome_extension,   --  triggers


# do something for default params, req parameet, optional parameters
"""
3. TRIGGER_STARTING_SIGMOYD : start the workflow when the app is started. config_inputs : None, outputs : None
4. TRIGGER_API_CALL : start the workflow when an API call is made. config_inputs: None. output: api_post_request_data
"""
trigger_finder="""
Act as a trigger finding agent and help me find the trigger for the agentic workflow accoding to the user query. The trigger will be one out of the followwing options only:-
1. TRIGGER_NEW_GMAIL_MESSAGE : start the workflow when a mail is received. config_inputs : None, output : new_mail_info including sender, subject, body, attachment_drive_link
2. TRIGGER_MANUAL : start the workflow when the user manually starts it. config_inputs : None , output: None
3. TRIGGER_PERIODIC : start the workflow at a specific time or after a specific interval. config_inputs : type (time/interval), time, interval . output : None
trigger schema:-

{{

  "name" : str (trigger name),
  "description" : str (define in good detail what the trigger does and what output it gives),
  "config_inputs": Dict[str,str] (json containing inputs required by the trigger.), (if config_inputs is NONE mentioned above, for the chosen trigger, then keep an empty dict here) 
  "output" : List[str] (output of the trigger. example:- new_mail_info, etc.)
}}

make sure that trigger don't have llm, hence it cannot analyse the input. It only recieves the input. also strictly keep above given inputs and outputs only. don't create extra inputs or outputs.
return the most relevant trigger according to user needs, which will be used to start the workflow. No preambles or postambles are required and give output in above format only. Keep all strings in double quotes.
"""
hhjjkk="""
2. TRIGGER_GITHUB_ISSUE_ADDED : start the workflow when a github issue is created. Inputs : Owner, Repo. output : issue_content
3. TRIGGER_YOUTUBE_VIDEO_UPLOAD : start the workflow when a new video is uploaded on youtube. Inputs : channel_name . output : video_link
4. TRIGGER_GOOGLE_FORM_SUBMISSION : start the workflow when a new form is submitted. Inputs : form_name. output : form_content
5. TRIGGER_MOBILE_NOTIFICATION : start the workflow when a notification is received on mobile. Inputs : app_name. output : notification_content
9. TRIGGER_MEET_EXTENSION : start the workflow when a user clicks on the chrome extension. Input : voice, output : transcribed text
"""




trigger_flow=ChatPromptTemplate.from_messages(
    [
        (
            "system",
            trigger_finder,
        ),
        (
            "human",
            (
                "{question}"
            ),
        ),
    ]
)

trigger_chain= trigger_flow| model | StrOutputParser()






"""
i want reply automation. i want you to monitor my emails. and if it has an product request in content or attachment, then i want you to get it's details and upload it to sheet. getting details from attachment might requier image to text or pdf to text conversions. now after this, i want you to check in another sheet if the requested product is available, if yes, then generate a reply email with product cost , (i have an existing template in docs, use it to generate email). if product is not available, then generate a polite reply email of unavailability and give suggestions for similar products. find similar products again from that sheet
"""



prompt_enhancer_for_workflow="""
SIGMOYD is a software, which will be used by users to create agentic workflows in seconds using prompts.
Act as a questioning agent 'SIGMOYD' and ask some questions from the user with respect to the given user query (to create AI agentic workflow) for finding details and clarity about the user requirements. The questions can include :-
("how the workflow will start. what will be the trigger", 
"Do the user needs to do manual validation or give some manual inputs in between the workflow?","does the user requier any llm to generate content in between the workflow or user already have content")


Triggers:-
GMAIL_NEW_GMAIL_MESSAGE,  MANUAL

STRICTLY give options for each question in bullet points in next lines, so that user can select from them. (keep options in the same string in which the question is present)
example format :- 'How will the workflow start? * GMAIL_NEW_GMAIL_MESSAGE * PERIODIC * STARTING_APP * API_CALL * MANUAL' (the * should be only before the name, not after the name)
If any questions required to ask from the user, return a python list of questions,  ask only the relavent questions. Try to keep less questions (most important ones) . Don't ask questions about something which is already clearly mentioned in the user's query. Also don't ask very technical questions.
if user is asking a question, then return a list in which first element is the answer to user's question, then all other questions. No preambles or postambles. 
strictly keep all strings in double quotes, and return a list starting wiht [ and ending with ].
"""

ok="""
PERIODIC, STARTING_APP, API_CALL,, CHROME_EXTENTION

IMAGE_ANALYSER , TRANSCRIBE_AUDIO_OR_VIDEO, TRANSCRIBE_FROM_YOUTUBE, TRANSLATE_TEXT, SQL_RUNNER, USER_VALIDATION (take input/ validation from user in between workflow) , 
RAG_SEARCH (semantic search some relevant information from collection of text/image embeddings , also locate the parent file in which the information belongs),
"""


ques_flow=ChatPromptTemplate.from_messages(
    [
        (
            "system",
            prompt_enhancer_for_workflow,
        ),
        (
            "human",
            (
                "{question}"
            ),
        ),
    ]
)

ques_flow_chain= ques_flow| model | StrOutputParser()





# code runner should be part of code generator

major_tool_finder="""
you are a tool finding agent of sigmoyd. Your task is to find all tools the user may include in his workflow from the given below list of tools. Chose tools from the list only.

(Tools with actions):-
1. NOTION :- actions : ["NOTION_CREATE_PAGE_IN_PAGE","NOTION_ADD_ONE_CONTENT_BLOCK_IN_PAGE","NOTION_INSERT_ROW_DATABASE"] (notion table and database are same)
2. LINKEDIN :- actions : ["LINKEDIN_GET_RECRUITER_EMAILS","LINKEDIN_JOBS_SEARCH","LINKEDIN_GET_PECIFIC_JOB_INFO","CREATE_LINKEDIN_POST"]
3. GMAIL :- actions : ["GMAIL_SEND_EMAIL","GMAIL_CREATE_EMAIL_DRAFT"]
4. GOOGLEDOCS :- actions : ["GOOGLEDOCS_GET_DOCUMENT_BY_URL","GOOGLEDOCS_CREATE_DOCUMENT"]
5. GOOGLECALENDAR :- actions : ["GOOGLECALENDAR_CREATE_EVENT","GOOGLECALENDAR_FIND_FREE_SLOTS"]
6. GOOGLEMEET :- actions : ["GOOGLEMEET_CREATE_MEET","GOOGLEMEET_GET_CONFERENCE_RECORD_FOR_MEET"]
7. GOOGLESHEETS :- actions : ["GOOGLESHEETS_GET_SHEET_ROWS"]
8. GOOGLEDRIVE :- actions : ["GOOGLEDRIVE_GET_FILE_CONTENT_FROM_URL"]
9. GITHUB :- actions : ["download_and_extract_repo"] (download and extract the codebase from github repo)
10. CODE_SUMMARY :- actions : ["summarise_codebase"] (summarise the downloaded codebase using CODE_SUMMARY tool)
11. VECTORISER :- actions : ["vectorise_codebase"] (vectorize the summarized codebase. takes the file path names as input in which tool will populate index file and metadata file ,STRICTLY BE USED AFTER CODE_SUMMARY TOOL)
12. VECTORQUERY :- actions : ["answer_question"] (answer question from the vectorized codebase given the populated index file and metadata file)

IMPORTANT : (9,10,11) are used for codebase vectorization. So these tools will be STRICTLY USED TOGETHER IN SEQUENCE.if user is asking for github codebase analysis or codebase related queries. 12 might be used independently if user already have vectorized codebase and just want to get answers from questions regarding the codebase

Other tools (Tools without actions):-


TEXT_INPUT (take text input from the user), 
CSV_AI (Analyses csv file and give natural language answer from natural language questions. This can also be used to modify the csv file , and return the path of modified csv file),
CSV_READER (read csv file and return the content in list of dict format, each dict is a row of csv),
FILE_UPLOAD (take file upload from user and returns the FILE PATH IN LOCAL DIRECTORY)
PDF_TO_TEXT (extract text from pdf, STRICTLY MUST BE USED WITH FILE_UPLOAD tool , if user mentions pdf file upload (or files which might be pdf - like resume, report, etc),so that the text inside the file can be extracted and passed to next tool/llm if required),
{customs}

NOTE :  WE DO HAVE LLM, VALIDATOR, ITERATOR (passing one element from the list), DELIGATOR capabilities, but you don't need to mention about these in the below json.

Return a json of tools out of above tools which can be used in the workflow given the user query. Keys of json will be WITH_ACTION, OTHERS,UNAVAILABLE.
The value for the key WITH_ACTION, will be another json, with keys as tool names (with action) and values as list of action names
Action names in the list should be strictly from above given actions

There will be a key "OTHERS" The value of this key will be a list of required tool names (without action).
The WITH_ACTION and OTHERS segregation performed above is for differentiating different kind of tools. SO STRICTLY FOLLOW THIS CONVENTION.
strictly return tools and action_name from above list only, do not keep any tool/action which is not present in the above list. Return tools which will be used after the trigger.

IMPORTANT : IF, USER ASKS FOR A FUNCTIONALITY FOR WHICH SOME OF THE TOOLS ARE NOT AVAILABLE, IN THIS CASE, THE VALUE FOR "UNAVAILABLE" KEY WILL BE THE "EXPLAINATION AND OTHER RELATED AVAILABLITIES", else, it will be None.
please keep the  "UNAVAILABLE" key, if any functionality asked by user is not available above, and also please don't keep irrelevant action/tool names in the list, if exact one is unavailable. just keep the list empty, or don't keep the key name
Example, if googlesheets don't have the functionality to insert new row, then please don't keep that action in the list, and mention that in the "UNAVAILABLE" section.
example :- {{
   WITH_ACTION:{{ "NOTION" : ["NOTION_CREATE_PAGE_IN_PAGE","NOTION_INSERT_ROW_DATABASE"],"GMAIL":["GMAIL_SEND_MAIL"]}}, "OTHERS" : ["FILE_UPLOAD","TEXT_INPUT","CSV_AI"] ,"UNAVAILABLE":"We are really sorry, currently sheet insert new row action is under construction, only GOOGLESHEETS_GET_SHEET_ROWS action is available, which might not be useful for you, hence, i have not used that action"}}
No preambles or postambles are required. Keep all strings in double quotes.
"""
ok="""
RAG_SEARCH (search some relevant information from collection) (use this tool only if user specifies a created collection on sigmoyd app),
WEB_SEARCH,  IMAGE_ANALYSER , TRANSCRIBE_AUDIO_OR_VIDEO, TRANSCRIBE_FROM_YOUTUBE, TRANSLATE_TEXT, SQL_RUNNER, USER_VALIDATION (take input/ validation from user in between workflow),
"""
#rag_builder (create a collection of text/image embeddings from pdf, web pages), 
 


major_tools=ChatPromptTemplate.from_messages(
    [
        (
            "system",
            major_tool_finder,
        ),
        (
            "human",
            (
                "user query :-{question}"
            ),
        ),
    ]
)

major_tool_chain= major_tools| model | StrOutputParser()









code="""You are a coder agent. The code should be generated using the given prompt by human. Import all the libraries first. The code should be error free with proper exception handling. The code should save all new files formed or changed files in directory TEMP/NEW/. Eg :- box plots created during execution or modified dataframes in csv, with unique and readable names to avoid confusions.
Add print statement for some modifications like what operation performed just now. The print statements must include what is being printed. dont print leanthy dataframes or arrays or content of any file. keep the print statements short and meaningful. Don't create dummy data for anything.
generate python code by default if not specified by the user. If the user wants code in other languages, then the user will specify the language in the prompt. The code should be generated in the specified language. No preambles or postambles are required. Generate only the code with proper comments.

Output format:- JSON object with the following schema:-
{{
    "code": str (generated code),
    "language": str (language of the code)
}}
"""

coder_prompt=ChatPromptTemplate.from_messages(
    [
        (
            "system",
            code,
        ),
        (
            "human",
            (
                "{prompt}"
            ),
        ),
    ]
)

coder_chain= coder_prompt| model | StrOutputParser()




















gemini_prompt=ChatPromptTemplate.from_messages(
    [
        
        (
            "human",
            (
                "{prompt}"
            ),
        ),
    ]
)
gemini_chain= gemini_prompt| model | StrOutputParser()











llm_sys_prompt="""

user query :- {question}
additional data:- {data}
keys of json :- {keys}

"""


llm_sys=ChatPromptTemplate.from_messages(
    [
        (
            "system",
           " Generate a response as per the user query. The response should be in JSON format strictly having the given keys. all strings should be in double quotes. no preamble or postambles are required. values of response will be according to the given user query and additional data.",
        ),
        (
            "human",
            (
                llm_sys_prompt
            ),
        ),
    ]
)

llm_sys_chain= llm_sys| model | StrOutputParser()



iterator_prompt="""
data: {data}
"""

iterator=ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are the input constructor for iterator agent. you will get some data, convert it into list if it is not already in list. And return a list of elements.
No preambles or postambles are required. eaxh string should be in double quotes.""",
        ),
        (
            "human",
            (
                iterator_prompt
            ),
        ),
    ]
)

iterator_chain= iterator| model | StrOutputParser()

