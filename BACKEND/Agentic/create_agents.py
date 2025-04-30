from fastapi import FastAPI, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, jwk
import requests
import logging
from clerk_backend_api import Clerk
import os
from dotenv import load_dotenv
from pydantic import BaseModel
import json
from Workflow_ec2.start_flow import syn
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware
from tools.tool_classes import *
import inspect
from tools.googlE import flow, setup_watch, save_google_credentials, get_fresh_google_credentials, extract_email
from auth import check_connection, create_connection_oauth2
from urllib.parse import unquote
from prompts import  ques_flow_chain,gemini_chain, major_tool_chain,trigger_chain
from tools.dynamo import db_client, s3_client
import json
import urllib.parse
import uuid
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
from openai import OpenAI
import asyncio
from redis.asyncio import Redis
load_dotenv()

client = OpenAI(api_key=os.getenv("deepseek"), base_url="https://api.deepseek.com")


recent_mails={}

composio_tools=["GMAIL","NOTION","GOOGLESHEETS","GOOGLEDOCS","GOOGLEMEET","GOOGLECALENDAR","GOOGLEDRIVE","YOUTUBE","LINKEDIN"]

class Query(BaseModel):
    query: str
    flag:int
    wid:str

class Question(BaseModel):
    question: dict
    query: str
    flag:int

class W(BaseModel):
    workflowjson: dict

class WP(BaseModel):
    workflowjson: dict
    refined_prompt : str

class ApiKeys(BaseModel):
    openai: str = None
    gemini: str =None
    composio: str

class Tool(BaseModel):
    service: str
    


groq = Groq()
# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

clerk_issuer = os.getenv("CLERK_ISSUER")
clerk_jwks_url = os.getenv("CLERK_JWKS_URL")
clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
clerk_sdk = Clerk(bearer_auth=clerk_secret_key)
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Start up
#     background_tasks = set()
#     task = asyncio.create_task(periodic_watch_refresh())
#     background_tasks.add(task)
#     yield
#     # Shutdown
#     for task in background_tasks:
#         task.cancel()
        
# async def periodic_watch_refresh():
#     while True:
#         # Get current timestamp in minutes
#         current_time = datetime.now(timezone.UTC)
#         current_timestamp = current_time.strftime("%Y-%m-%d %H:%M")
        
#         # Check if there are tasks for current timestamp
#         if current_timestamp in user_watch_sessions:
#             for task in user_watch_sessions[current_timestamp]:
#                 if task["type"] == "gmail":
#                      setup_watch(task["user_id"])
#                 elif task["type"] == "periodic":
#                     await periodic_trigger(task["user_id"], task["workflow_id"])
#             del user_watch_sessions[current_timestamp]
        
#         # Calculate seconds until next minute
#         next_minute = current_time.replace(second=0, microsecond=0) + timedelta(minutes=1)
#         sleep_seconds = (next_minute - current_time).total_seconds()
        
#         # Wait until next minute
#         await asyncio.sleep(sleep_seconds)

async def periodic_trigger(user_id: str, workflow_id: str):
    # Implement your periodic trigger logic here
    pass


# @celery_app.task
# def syn(agent_list,sub_task):
#     asyncio.run(og_workflow(agent_list,sub_task))



# app = FastAPI(lifespan=lifespan)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust according to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


security = HTTPBearer()
def get_jwks():
    response = requests.get(clerk_jwks_url)
    return response.json()
def get_public_key(kid):
    jwks = get_jwks()
    for key in jwks['keys']:
        if key['kid'] == kid:
            return jwk.construct(key)
    raise HTTPException(status_code=401, detail="Invalid token")
def decode_token(token: str):
    headers = jwt.get_unverified_headers(token)
    kid = headers['kid']
    public_key = get_public_key(kid)
    # print("public_key",public_key)
    # First decode without verification to get the audience
    unverified_claims = jwt.get_unverified_claims(token)
    # print("unverified_claims",unverified_claims)
    audience = unverified_claims.get('sub')
    token_issuer = unverified_claims.get('iss')
    # print("audience", audience)
    # print("Token issuer:", token_issuer)
    # print("Expected issuer:", clerk_issuer)
    return jwt.decode(token, public_key.to_pem().decode('utf-8'), algorithms=['RS256'], audience=audience , issuer=token_issuer)




prev=None
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global prev
    await websocket.accept()

    # Extract token from query param
    token = websocket.query_params.get("token")
    # print("tokem",token) 
    if not token:
        await websocket.close()
        return
    # while True:
    try:
        payload = decode_token(token)  # Your Clerk JWT decoder
        user_id = payload.get("sub")
        # print("user_id",user_id)
        if not user_id:
            await websocket.close()
            return

        # Create Redis connection and subscribe
        redis = Redis(host="localhost", port=6379, db=0, decode_responses=True)
        pubsub = redis.pubsub()
        channel = f"workflow_{user_id}"
        await pubsub.subscribe(channel)

        try:
            
            async for message in pubsub.listen():
                print(message)
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    if prev and prev==data:
                        
                        continue
                    await websocket.send_json(data)
                    prev = data

        except WebSocketDisconnect:
            print(f"User {user_id} disconnected")
        # finally:
        #     await pubsub.unsubscribe(f"workflow_updates:{user_id}")
        #     await pubsub.close()
        #     await redis.close()

    except Exception as e:
        print("Auth or Redis Error:", e)
        await websocket.close()




@app.post("/file_upload")
async def file_upload(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    form = await request.form()
    file = form.get("file")
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_content = await file.read()
    original_file_name = file.filename
    unique_file_name = f"{uuid.uuid4()}_{original_file_name}"
    
   

    with open(unique_file_name, "wb") as f:
        f.write(file_content)
    
    # Save file information to the database
    # try:
    #     bucket_name = "your-s3-bucket-name"  # Replace with your S3 bucket name
    #     s3_client.put_object(
    #         Bucket=bucket_name,
    #         Key=unique_file_name,
    #         Body=file_content
    #     )
    #     db_client.put_item(
    #         TableName="user_files",
    #         Item={
    #             "user_id": {"S": user_id},
    #             "file_name": {"S": unique_file_name},
    #             "original_file_name": {"S": original_file_name},
    #             "s3_bucket": {"S": bucket_name},
    #             "s3_key": {"S": unique_file_name}
    #         }
    #     )
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=f"Error saving file to S3 or database: {str(e)}")
    
    return {"file_location_s3": unique_file_name}




@app.post("/checkuser")
async def check_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    try:
        print(f"Checking user_id: {user_id}")

        # Debugging: List all table names
        # tables = db_client.list_tables()
        # print(f"Available tables: {tables}")
        # response = db_client.describe_table(TableName="users")
        # print(response["Table"]["KeySchema"])

        response = db_client.get_item(
            TableName="users",
            Key={"clerk_id": {"S": user_id}}
        )

        # print("Response from DynamoDB:", response)  # ✅ Should print response
        
        if "Item" not in response:
            db_client.put_item(
                TableName="users",
                Item={
                    "clerk_id": {"S": user_id},
                    "plan": {"S": "free"},
                    "api_key": {"M": {}},
                    "token_count": {"N": "0"},
                    "gmailtrigger": {"M": {}}
                },
            )

        # table_name = 'custom_credentials'

        # # Check if the table exists
        # existing_tables = db_client.list_tables()['TableNames']

        # if table_name not in existing_tables:
        #     # Create table
        #     response = db_client.create_table(
        #         TableName=table_name,
        #         KeySchema=[
        #             {'AttributeName': 'mail', 'KeyType': 'HASH'}  # Primary Key (Partition Key)
        #         ],
        #         AttributeDefinitions=[
        #             {'AttributeName': 'mail', 'AttributeType': 'S'}  # String type
        #         ],
        #         ProvisionedThroughput={
        #             'ReadCapacityUnits': 5,
        #             'WriteCapacityUnits': 5
        #         }
        #     )
        #     print(f"Table '{table_name}' is being created...")
        # else:
        #     print(f"Table '{table_name}' already exists.")

    except Exception as e:
        print(f"Error: {e}")  # ✅ Print error details
        raise HTTPException(status_code=500, detail=f"Error accessing DynamoDB: {str(e)}")




@app.post("/save_workflow")
async def save_flow(w:W,credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    try:
        response = db_client.update_item(
            TableName='users',
            Key={'clerk_id': {'S': user_id}},
            UpdateExpression="SET workflows.#wid.#json = :new_json",
            ExpressionAttributeNames={
            '#wid': w.workflowjson["workflow_id"],
            '#json': 'json'
            },
            ExpressionAttributeValues={
            ':new_json': {'S': json.dumps(w.workflowjson, indent=2)}
            },
            ReturnValues="UPDATED_NEW"
        )
        print("Update succeeded:", response)
    except Exception as e:
        print("Error updating item:", e)
        
    # return {"status": "success"}
    return {"json":w.workflowjson}

@app.post("/public_workflow")
async def public_workflow(w: WP, credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    # Check if public_workflows table exists
    try:
        # List all tables to check if public_workflows exists
        existing_tables = db_client.list_tables()['TableNames']
        table_name = 'public_workflows'
        
        if table_name not in existing_tables:
            # Create the public_workflows table with wid as primary key
            response = db_client.create_table(
                TableName=table_name,
                KeySchema=[
                    {'AttributeName': 'wid', 'KeyType': 'HASH'}  # Primary Key
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'wid', 'AttributeType': 'S'}  # String type
                ],
                ProvisionedThroughput={
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            )
            print(f"Table '{table_name}' is being created...")
            
            # Wait for table to be created before proceeding
            waiter = db_client.get_waiter('table_exists')
            waiter.wait(TableName=table_name)
            print(f"Table '{table_name}' is now available")
        
        # Save the workflow to the public_workflows table
        workflow_id = w.workflowjson["workflow_id"]
        refined_prompt = w.refined_prompt
        
        db_client.put_item(
            TableName='public_workflows',
            Item={
                'wid': {'S': workflow_id},
                'clerk_id': {'S': user_id},
                'refined_prompt': {'S': refined_prompt},
                'json': {'S': json.dumps(w.workflowjson, indent=2)},
                'uses': {'N': '0'},
                'likes': {'N': '0'},
                'comments': {'L': []}
            }
        )

        try:
            response = db_client.update_item(
                TableName='users',
                Key={'clerk_id': {'S': user_id}},
                UpdateExpression="SET workflows.#wid.#pub = :is_public",
                ExpressionAttributeNames={
                '#wid': w.workflowjson["workflow_id"],
                '#pub': 'public'
                },
                ExpressionAttributeValues={
                ':is_public': {'BOOL': True}
                },
                ReturnValues="UPDATED_NEW"
            )
            print("Update succeeded:", response)
        except Exception as e:
            print("Error updating item:", e)
        
        print(f"Workflow {workflow_id} added to public workflows")
        return {"json":w.workflowjson}
    
    except Exception as e:
        print(f"Error in public_workflow: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving public workflow: {str(e)}")


@app.delete("/delete_workflow/{workflow_id}")
async def delete_workflow(workflow_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    try:
        # Fetch user data
        user_data = db_client.get_item(
            TableName="users",
            Key={"clerk_id": {"S": user_id}}
        )
        
        # Check if workflows exist
        workflows = user_data.get("Item", {}).get("workflows", {}).get("M", {})
        if workflow_id not in workflows:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Delete the workflow
        response = db_client.update_item(
            TableName="users",
            Key={"clerk_id": {"S": user_id}},
            UpdateExpression="REMOVE workflows.#wid",
            ExpressionAttributeNames={
                "#wid": workflow_id
            },
            ReturnValues="UPDATED_NEW"
        )
        print("Workflow deleted successfully:", response)
        return {"status": "success", "message": "Workflow deleted successfully"}
    
    except Exception as e:
        print("Error deleting workflow:", e)
        raise HTTPException(status_code=500, detail=f"Error deleting workflow: {str(e)}")

@app.post("/save_api_keys")
async def save_api_keys(api_keys:ApiKeys,credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    try:
        print(api_keys.dict().items())
        response = db_client.update_item(
            TableName='users',
            Key={'clerk_id': {'S': user_id}},
            UpdateExpression="SET api_key = :new_api_keys",
            ExpressionAttributeValues={
            ':new_api_keys': {'M': {k: {'S': v} for k, v in api_keys.dict().items() if v!=None }}
            },
            ReturnValues="UPDATED_NEW"
        )
        print("Update succeeded:", response)
    except Exception as e:
        print("Error updating item:", e)
        
    return {"status": "success"}


@app.get("/sidebar_workflows")
async def get_sidebar_workflows(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    user_data = db_client.get_item(
        TableName="users",
        Key={"clerk_id": {"S": user_id}}
    )
    
    workflows = user_data.get("Item", {}).get("workflows", {}).get("M", {})
    
    formatted_workflows = []
    
    for item in workflows.items():
        wid = item[0]
        workflow = item[1]
        
        # Check if we have a third element (public flag)
        public = False
        if len(item) == 3:
            public = item[2]
        elif "public" in workflow.get("M", {}):
            public = workflow.get("M", {}).get("public", {}).get("BOOL", False)
        
        formatted_workflows.append({
            "id": wid,
            "name": json.loads(workflow.get("M", {}).get("json", {}).get("S", "{}")).get("workflow_name", ""),
            "json": workflow.get("M", {}).get("json", {}).get("S", "{}"),
            "prompt": workflow.get("M", {}).get("prompt", {}).get("S", ""),
            "active": json.loads(workflow.get("M", {}).get("json", {}).get("S", "{}")).get("active", False),
            "public": public
        })
    # print(formatted_workflows)

    return JSONResponse(content=formatted_workflows)



@app.post("/run_workflow")
async def run_workflow(w:W,credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    w.workflowjson["active"]=True
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    user_data = db_client.get_item(
            TableName="users",
            Key={"clerk_id": {"S": user_id}}
        )
        
    plan = user_data.get("Item", {}).get("plan", {}).get("S", "")
    api_key = user_data.get("Item", {}).get("api_key", {}).get("M", {})
    
    if plan == "free" and not api_key:
        return JSONResponse(content={"status": "error", "message": "Please fill in your API keys to proceed."}, status_code=400)
    
    # task = syn.delay(user_id, w.workflowjson)
    # trigger=w.workflowjson["trigger"]
    tools=[i["name"].lower() for i in w.workflowjson["workflow"] if i["type"]=="tool" and i["name"].upper() in composio_tools]
    # print(trigger)
    response = db_client.get_item(
                TableName='users',
                Key={'clerk_id': {'S': user_id}}
            )
    api_keys = response.get('Item', {}).get('api_key', {}).get('M', {})
    final_dict = {k: v['S'] for k, v in api_keys.items()}
    
    for i in tools:
        if not check_connection(i, final_dict["composio"]):
            return JSONResponse(content={"status": "error", "message": "Please fill in your API keys to proceed."}, status_code=400)

    try:
        response = db_client.update_item(
            TableName='users',
            Key={'clerk_id': {'S': user_id}},
            UpdateExpression="SET workflows.#wid.#json = :new_json",
            ExpressionAttributeNames={
            '#wid': w.workflowjson["workflow_id"],
            '#json': 'json'
            },
            ExpressionAttributeValues={
            ':new_json': {'S': json.dumps(w.workflowjson, indent=2)}
            },
            ReturnValues="UPDATED_NEW"
        )
        print("Update succeeded:", response)
    except Exception as e:
        print("Error updating item:", e)
    task = syn.delay(w.workflowjson["workflow_id"], w.workflowjson["workflow"], user_id, "")
    
    return {"json": w.workflowjson}
    


    



@app.post("/activate_workflow")
async def activate_workflow(w:W,credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    if not w.workflowjson["active"]:
        
        user_data = db_client.get_item(
            TableName="users",
            Key={"clerk_id": {"S": user_id}}
        )
        
        plan = user_data.get("Item", {}).get("plan", {}).get("S", "")
        api_key = user_data.get("Item", {}).get("api_key", {}).get("M", {})
        
        if plan == "free" and not api_key:
            return JSONResponse(content={"status": "error", "message": "Please fill in your API keys to proceed."}, status_code=400)
        
        # task = syn.delay(user_id, w.workflowjson)
        trigger=w.workflowjson["trigger"]
        tools=[i["name"].lower() for i in w.workflowjson["workflow"] if i["type"]=="tool" and i["name"].upper() in composio_tools]
        # for tool in w.workflowjson["workflow"]:
        #     if tool["type"] == "tool" and tool["name"].upper() in composio_tools:
        #         class_name = globals().get(tool["name"].upper())
        #         if class_name:
        #             method_name = tool["tool_action"]
        #             if hasattr(class_name, method_name):
        #                 method = getattr(class_name, method_name)   
        #                 signature = inspect.signature(method)
        #                 required_params = set(signature.parameters.keys()) - {"self"}
        #                 config_inputs_keys = set(tool.get("config_inputs", {}).keys())
        #                 data_flow_inputs_keys = set(tool.get("data_flow_inputs", []))
        #                 missing_params = required_params - (config_inputs_keys | data_flow_inputs_keys)
        #                 for param in missing_params:
        #                     tool.setdefault("config_inputs", {})[param] = ""
        print(trigger)
        print(tools)
        if trigger["name"]=="TRIGGER_NEW_GMAIL_MESSAGE":
            # here try to handle all auths, 

            try:
                user_details = clerk_sdk.users.list(user_id=[user_id])[0]
                mail=user_details.email_addresses[0].email_address
                setup_watch(mail)
                # return {"status":"workflow activated"}
            except Exception as e:
                print("Error setting up Gmail watch:", e)
                return JSONResponse(content={"status": "error", "message": "Please fill in your API keys to proceed."}, status_code=400)
        elif trigger["name"]=="TRIGGER_PERIODIC":
            pass


        #tool auths

        response = db_client.get_item(
                TableName='users',
                Key={'clerk_id': {'S': user_id}}
            )
        api_keys = response.get('Item', {}).get('api_key', {}).get('M', {})
        final_dict = {k: v['S'] for k, v in api_keys.items()}
        
        for i in tools:
            if not check_connection(i, final_dict["composio"]):
                return JSONResponse(content={"status": "error", "message": "Please fill in your API keys to proceed."}, status_code=400)
        
        w.workflowjson["active"]=True
        try:
            response = db_client.update_item(
                TableName='users',
                Key={'clerk_id': {'S': user_id}},
                UpdateExpression="SET workflows.#wid.#json = :new_json",
                ExpressionAttributeNames={
                '#wid': w.workflowjson["workflow_id"],
                '#json': 'json'
                },
                ExpressionAttributeValues={
                ':new_json': {'S': json.dumps(w.workflowjson, indent=2)}
                },
                ReturnValues="UPDATED_NEW"
            )
            print("Update succeeded:", response)
        except Exception as e:
            print("Error updating item:", e)









            
    else:
        w.workflowjson["active"]=False
        # store in database that it is false now
        try:
            response = db_client.update_item(
                TableName='users',
                Key={'clerk_id': {'S': user_id}},
                UpdateExpression="SET workflows.#wid.#json = :new_json",
                ExpressionAttributeNames={
                '#wid': w.workflowjson["workflow_id"],
                '#json': 'json'
                },
                ExpressionAttributeValues={
                ':new_json': {'S': json.dumps(w.workflowjson, indent=2)}
                },
                ReturnValues="UPDATED_NEW"
            )
            print("Update succeeded:", response)
        except Exception as e:
            print("Error updating item:", e)
        trigger=w.workflowjson["trigger"]
        print(trigger)

        if trigger["name"]=="TRIGGER_NEW_GMAIL_MESSAGE":
            # delete setup watch
            pass
        elif trigger["name"]=="TRIGGER_PERIODIC":
            pass

            
    
            
    


    

    return {"json":w.workflowjson}
    
        
    
def get_latest_email_id(email_address):
    url = f"https://gmail.googleapis.com/gmail/v1/users/{email_address}/messages"
    
    creds,user_id = get_fresh_google_credentials(email_address)
    headers = {"Authorization": f"Bearer {creds.token}"}

    params = {"maxResults": 1, "labelIds": ["INBOX"]}
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        messages = response.json().get("messages", [])
        if messages:
            return messages[0]["id"],user_id  # ✅ Returns message ID
    return None


def get_email_content(email_address, message_id):
    url = f"https://gmail.googleapis.com/gmail/v1/users/{email_address}/messages/{message_id}"

    creds,user_id = get_fresh_google_credentials(email_address)
    headers = {"Authorization": f"Bearer {creds.token}"}

    
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        email_data = response.json()
        return email_data  # Full email content
    
    return None


    



@app.post("/gmail-webhook",tags=["trigger"])
async def gmail_webhook(request: Request):
    data = await request.json()
    # print(data)
    # Extract message details
    # if "message" in data:
    #     message_id = data["message"]["data"]  # Base64 encoded Pub/Sub message
    #     print(f"New email notification received: {message_id}")
    

    message_id ,user_id= get_latest_email_id(data["emailAddress"])
    if recent_mails.get(data["emailAddress"]):
        if recent_mails[data["emailAddress"]]==message_id:
            return {"status": "success"}
    recent_mails[data["emailAddress"]] = message_id
    print("user_id",user_id)    
    if message_id:
        email_data = get_email_content(data["emailAddress"], message_id)
        # print(email_data)
        tg_o=extract_email(email_data)
        # Fetch user data from DynamoDB
        user_data = db_client.get_item(
            TableName="users",
            Key={"clerk_id": {"S": user_id}}
        )

        # Extract workflows
        workflows = user_data.get("Item", {}).get("workflows", {}).get("M", {})

        # Filter active workflows with Gmail trigger
        # Debugging: Print the structure of workflows
        # print("Workflows structure:", workflows)

        active_gmail_workflows = [
            {
                "id": wid,
                "workflow": json.loads(workflow.get("M", {}).get("json", {}).get("S", "{}"))
            }
            for wid, workflow in workflows.items()
            if json.loads(workflow.get("M", {}).get("json", {}).get("S", "{}")).get("active",False) and
               json.loads(workflow.get("M", {}).get("json", {}).get("S", "{}")).get("trigger", {}).get("name") == "TRIGGER_NEW_GMAIL_MESSAGE"
        ]

        # Debugging: Print the filtered workflows
        # print("Active Gmail Workflows:", active_gmail_workflows)

        # # Log or process the filtered workflows
        # print("Active Gmail Workflows:", active_gmail_workflows)
        for workflow in active_gmail_workflows:
            # print(workflow["workflow"]["workflow"])
            # print(type(workflow["workflow"]["workflow"]))
            syn.delay(workflow["id"],workflow["workflow"]["workflow"], user_id, tg_o)
        # syn.delay()
        
      
    return {"status": "success"}


@app.get("/user_auths")
def user_auths(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    api_keys_response = db_client.get_item(
            TableName='users',
            Key={'clerk_id': {'S': user_id}}
        )
    api_keys = api_keys_response.get('Item', {}).get('api_key', {}).get('M', {})
    api_keys = {k: v['S'] for k, v in api_keys.items()}
    print(api_keys)
    comp={app.capitalize():check_connection(app,api_keys["composio"]) for app in composio_tools}
    
    # extract user auths from database
    return {"user_auths":comp,
            "api_keys":api_keys
            }


@app.post("/auth")
def auth(tool:Tool,credentials: HTTPAuthorizationCredentials = Depends(security)):  # Ensure user is logged in via Clerk
    # take a post req with parameter - tool : gmail/sheets etc

    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    

    # Generate OAuth URL with Clerk user info
    print(user_id)
    if tool.service=="gmailtrigger":
        state = json.dumps({"user_id": user_id})  # Save Clerk User ID in state
        encoded_state = urllib.parse.quote(state)  # Encode state for URL safety

        auth_url, _ = flow.authorization_url(
            prompt="consent",
            state=encoded_state  # Pass state in the request
        )
        print(auth_url)
    
         # save in database  auth_temp = gmail / sheets / etc


    else:
        response = db_client.get_item(
            TableName='users',
            Key={'clerk_id': {'S': user_id}}
        )
        api_keys = response.get('Item', {}).get('api_key', {}).get('M', {})
        final_dict = {k: v['S'] for k, v in api_keys.items()}
        auth_url=create_connection_oauth2(tool.service,final_dict["composio"])
        print(auth_url)
        # if check_connection(tool.name,final_dict["composio"]):
            

        

    return {"auth_url": auth_url}

@app.post("/delete_auth")  
def dele(tool:Tool,credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    # return JSONResponse(content={"status": "error", "message": "cannot delete auth"}, status_code=400)
    

    return {"status": "success"}
    



@app.get("/auth/callback")
def auth_callback(request: Request):
    # can i send all google wale to here? or only gmail?
    flow.fetch_token(authorization_response=str(request.url))
    credentials = flow.credentials

    # Extract state parameter (which contains Clerk user ID)
    state_param = request.query_params.get("state")
    if not state_param:
        raise HTTPException(status_code=400, detail="Missing state parameter")

    state_data = json.loads(unquote(state_param))  # Decode and parse JSON
    user_id = state_data.get("user_id")  # Clerk User ID

    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    user_details = clerk_sdk.users.list(user_id=[user_id])[0]
    mail=user_details.email_addresses[0].email_address
    # Save credentials mapped to Clerk user ID
    # retrieve auth_temp for that user from the database  gmail / sheets / etc
    # for that tool, save the credentials, and make auth_temp=None
    # if auth_temp is already None, then raise an error
    print(credentials.to_json())
    save_google_credentials(user_id,mail, credentials.to_json())
    from fastapi.responses import HTMLResponse
    success_html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authorization Successful</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: auto; padding: 20px; border-radius: 10px; background-color: #f3f3f3; }
            h2 { color: green; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Authorization Successful to SIGMOYD</h2>
            <p>You have successfully authorized your account. You can close this page now.</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=success_html)


def delete_gmail_trigger():
    #just remove from user_watch_sessions.
    pass





@app.get("/protected")
async def protected_route( credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
# Now that we have verified the Bearer token and extracted the 
# user ID, we can proceed to access protected resources. Note that # # using the Bearer token is more secure than passing a session ID in # the query parameter.
# We retrieve user details from Clerk directly using the user ID.
    clerk_sdk = Clerk(bearer_auth=clerk_secret_key)
    user_details = clerk_sdk.users.list(user_id=[user_id])[0]
    ret= {
        "status": "success",
        "data": {
            "first_name": user_details.first_name,
            "last_name": user_details.last_name,
            "email": user_details.email_addresses[0].email_address,
            "phone": user_details.phone_numbers,
            "session_created_at": user_details.created_at,
            "session_last_active_at": user_details.last_active_at,
        }
    }
    print(ret)
    return ret







@app.post("/refine_query")
async def refine_query(q: Question,credentials: HTTPAuthorizationCredentials = Depends(security)):
    # credentials: HTTPAuthorizationCredentials = Depends(security)
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    if q.flag==0:
        ques =ques_flow_chain.invoke({"question":"\nQUERY:-\n"+q.query})
        print(ques)
        if ques[0]=="`":
            try:
                ques=json.loads(ques[10:-4])
            except:
                ques=json.loads(ques[10:-3])
        else:
            ques=json.loads(ques)
        print(ques)
        return {"response":ques}
    
    else:
        print(q.question)
        refined_query=gemini_chain.invoke({"prompt":f"Act as a query enhancer specialist . Refine the old query and generate a detailed new query based on the following questions and answers (user needs). "+"\nOLD QUERY:-\n"+q.query+f"\n More specific user needs (questions answered by user):- \n{q.question}"+"\n.Add all necessary details from user's answers to the new query ,and return a new query which will be further used to create agentic workflow. \nGive only the refined query, don't skip anything. keep the details in refined query in a proper order so that user can get an optimized and relevant workflow, according to exactly what he wants. (No preambles and postambles)\
SOME CONTEXT:- You are problem understanding agent, whose task is to transform the user's vague query to a well defined query, so that, it can be used to generate multi agent, multi tool workflows including agents like llm (LARGE LANGUAGE MODEL), validator (LLM for if-else, whose outputs affects the execution of next tools), iterator (used to one by one pass each element of list of inputs to next agents for execution), deligator (deligate tasks to different agents),TRIGGER (which starts the workflow), and many differnt tools (functions which takes some inputs and returns some outputs)\
you need to understand what user actually wants and which agents to use, in what order, and using this understanding, generate a well defined and detailed query having proper explanation in ordered bullet points (not only agent names) (For each agent, keep Short explainations, and don't copy above questions and answers, instead give short explaination of what needs to be done).\
Some points to follow: - if any tool's input has to be decided by some condition, so rather than using a validator, strictly use a TEXT INPUT TOOL (even if condition is already given) where user will again define all conditions, and then strictly use LLM ( which will decide next tool input based on the condition and previous tool output) Eg - sending mail to different people based on some condition (here tool is send mail, and inputs can vary).\
- must use validator if user wants to execute a different set of tools based on any condition is true or false. And give seperate agents for each set. \
- don't give extra irrelevant tools which are not asked (Eg : email parser, error handling, etc.) \
- After trigger, use a validator if only for some of the cases, workflow should be executed (eg : execute the workflow for some kind of emails only after email trigger)\
- please keep short explainations for each agent. don't give so many lines.\
- please keep less usage of llms. try to incorporate all extraction tasks in few llms.\
    \
    available llms:-\
1. CODER : code generation. input : llm_prompt. output : {{'code':generated_code, 'language':language of code}}.\
2. AI : generalized multipurpose llm for general text generation. input : llm_prompt. output : generated content (all required outputs in json format)\
    \
    (TOOLS WITH ACTIONS):-\
1. NOTION :- actions : ['NOTION_CREATE_PAGE_IN_PAGE','NOTION_ADD_ONE_CONTENT_BLOCK_IN_PAGE','NOTION_INSERT_ROW_DATABASE'] (notion table and database are same)\
2. LINKEDIN :- actions : ['LINKEDIN_GET_RECRUITER_EMAILS','LINKEDIN_JOBS_SEARCH','LINKEDIN_GET_PECIFIC_JOB_INFO','CREATE_LINKEDIN_POST']\
3. GMAIL :- actions : ['GMAIL_SEND_EMAIL','GMAIL_CREATE_EMAIL_DRAFT']\
4. GOOGLEDOCS :- actions : ['GOOGLEDOCS_GET_DOCUMENT_BY_URL','GOOGLEDOCS_CREATE_DOCUMENT']\
5. GOOGLECALENDAR :- actions : ['GOOGLECALENDAR_CREATE_EVENT','GOOGLECALENDAR_FIND_FREE_SLOTS']\
6. GOOGLEMEET :- actions : ['GOOGLEMEET_CREATE_MEET','GOOGLEMEET_GET_CONFERENCE_RECORD_FOR_MEET']\
7. GOOGLESHEETS :- actions : ['GOOGLESHEETS_GET_SHEET_ROWS']\
8. GOOGLEDRIVE :- actions : ['GOOGLEDRIVE_GET_FILE_CONTENT_FROM_URL']\
9. GITHUB :- actions : ['download_and_extract_repo'] (download and extract the codebase from github repo)\
10. CODE_SUMMARY :- actions : ['summarise_codebase'] (summarise the downloaded codebase using CODE_SUMMARY tool)\
11. VECTORISER :- actions : ['vectorise_codebase'] (vectorize the summarized codebase. takes the file path names as input in which tool will populate index file and metadata file ,STRICTLY BE USED AFTER CODE_SUMMARY TOOL)\
12. VECTORQUERY :- actions : ['answer_question'] (answer question from the vectorized codebase given the populated index file and metadata file)\
IMPORTANT : (9,10,11) are used for codebase vectorization. So these tools will be STRICTLY USED TOGETHER IN SEQUENCE.if user is asking for github codebase analysis or codebase related queries. 12 might be used independently if user already have vectorized codebase and just want to get answers from questions regarding the codebase\
    \
OTHER TOOLS (TOOLS WITHOUT ACTIONS):-\
TEXT_INPUT (take text input from the user),\
CSV_AI (Analyses/filters csv file using natural language query. This can also be used to modify/filter the csv file . Return the answer of asked query or path of modified/filtered csv file),\
CSV_READER (read csv file and return the content in list format, each element is a json (row of csv). This tool must be used with file upload, if user wants to perform some operations using csv file content),\
FILE_UPLOAD (take file upload from user and returns the FILE PATH IN LOCAL DIRECTORY)\
PDF_TO_TEXT (extract text from pdf, STRICTLY MUST BE USED WITH FILE_UPLOAD tool , if user mentions pdf file upload (or files which might be pdf - like resume, report, etc),so that the text inside the file can be extracted and passed to next tool/llm if required),\
    TOOL USAGE TIPS:- (IMPORTANT)\
    - if user wants to perform some operation using the filtered csv file content, then STRICTLY use CSV_AI (returns filtered csv path) -> CSV_READER (returns content in list format) -> ITERATOR (iterate each row of csv) -> ...(further operations)\
                                           "})
        query=refined_query
        print("refined  ::",query)
    
 
      
        return {"response":query} 



# add functionality where user can exactly select what custom tool he wants to use??????       
@app.post("/create_agents")
async def create_agents(query : Query, credentials: HTTPAuthorizationCredentials = Depends(security)):    # custom will be the list of selected cutom tools by user
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    with open("tools/user_made_custom.json") as f:
        custom=json.load(f)
    
    to_embed=[f"{i['name']} : {i['description']}" for i in custom]
    to_embed="\n".join(to_embed)

    # dynamically add all custom tools to major_tool_chain from custom_tools.json
    major_tool_list= major_tool_chain.invoke({"question":query,"customs":to_embed})
    print(query.query)
    
    if major_tool_list[0]=="`":
        major_tool_list=json.loads(major_tool_list[7:-4])
    else:
        major_tool_list=json.loads(major_tool_list)
    print(major_tool_list)
    ret_un=None
    if major_tool_list.get("UNAVAILABLE"):
        ret_un=major_tool_list["UNAVAILABLE"]
    
    with open("tools/composio.json") as f:
        composio=json.load(f)
    with open("tools/custom_tools.json") as f:
        oth_tools=json.load(f)
    with open("tools/user_made_custom.json") as f:
        user=json.load(f)
    oth_tools+=user
    to_embed_composio=[]
    to_embed_other=[]
    for tool in major_tool_list["WITH_ACTION"]:
        if tool.upper() in composio:
            tool_actions=tool.upper()+"(Actions):-\n"
            for use_case in major_tool_list["WITH_ACTION"][tool]:
                cls = globals()[tool.upper()]
                method = getattr(cls, use_case)

                # Get function signature
                signature = inspect.signature(method)

                inputs=[{name: param.default if param.default is not inspect.Parameter.empty else None}
                for name, param in signature.parameters.items()]
                
                for action in composio[tool.upper()]:
                    if action["action"].upper()==use_case.upper():
                        tool_actions+=f"{use_case} -> input parameters and their explainations: {inputs[1:]} , outputs: {action['output']}\n"
                
            to_embed_composio.append(tool_actions)
        
        # elif tool.upper()=="OTHERS":
    for oth_maj in major_tool_list["OTHERS"]+list(major_tool_list["WITH_ACTION"].keys()):
        tool_actions=""
        for oth in oth_tools:
            if oth["name"].upper()==oth_maj.upper():
                tool_actions+=f"{oth['name']}:{oth['description']}, inputs: {oth['inputs']}, outputs: {oth['outputs']}\n"
        to_embed_other.append(tool_actions)

            
    to_embed_composio="\n".join(to_embed_composio)
    to_embed_other="\n".join(to_embed_other)

    # chat_completion = groq.chat.completions.create(                          
        
    #         messages=[
    #             {
    #                 "role": "system",
    #                 "content": trigger_finder                           

    #             },
    #             {
    #                 "role": "user",
    #                 "content": query.query,
    #             },
    #         ],
    #         model="llama-3.3-70b-versatile",                       
    #         temperature=0,    
    #         # Streaming is not supported in JSON mode
    #         stream=False,
    #         # Enable JSON mode by setting the response format
    #     )
    trigger=  trigger_chain.invoke({"question":query.query})
    print(query.query)

    if trigger[0]=="`":
        trigger=json.loads(trigger[7:-4])
    else:
        trigger=json.loads(trigger)
    print(trigger)
    # print("Triggers:-",trigger["name"], trigger["description"], "outputs:", trigger["output"], "\n")  # Updated to print trigger details
    # if chat_completion.choices[0].message.content[0]=="`":
    #     try:
    #         trigger=json.loads(chat_completion.choices[0].message.content[7:-4])
    #     except:
    #         trigger={"name":"unavailable","description":"unavailable","output":"unavailable"}
    # else:
    #     try:
    #         trigger=json.loads(chat_completion.choices[0].message.content)
    #     except:
    #         trigger={"name":"unavailable","description":"unavailable","output":"unavailable"}
    

    trigger["id"]=0
    # Return the response as JSON

    print("to_embed_composio",to_embed_composio)
    print("to_embed_other",to_embed_other)

    tool_finder=f"""
You are an expert workflow architect specializing in AI agent orchestration. When given a user query, design an ordered list of specialized agents with rectifier checkpoints.  using this structure:


{{
"workflow_name": (suitable name with spaces between words),
"workflow" (list of agents): [
{{  "id": int (1/2/3...),
    "type" : str (tool/llm/connector),
    "name" : str (name of tool/llm/connector),  
    "tool_action" (only for tool agents. keep empty string if no action available for that tool): str (action for that tool) ,
    "description" : str (how the tool/llm/connector will be used to execute the subtask. don't keep it very specific, because specific information might get changed by user later. just keep the main idea of how this tool will be used to solve the problem. example - "analyse/modify the csv file" is main idea, but "remove the first column from csv file" is specific information which might change later.) ,
    "to_execute" (List with 2 strings)/None: ['connector_p','Y'] if this agent needs to be executed if condition of connector_p is true, ['connector_p','N'] if agent needs to be executed if condition of connector_p is false.  (here p is the last just passed conditional connector id.), None if any connector don't affect this agent.
    "config_inputs" : (dict of inputs required by the agent from the user before workflow execution. example :- {{"link_of_notion_page":"put here if available in user query, else keep empty"}}  (these are pre decided inputs, and don't change for different workflow executions)(use config inputs only if any information needed by this tool cannot be found from previous tool outputs)
    "data_flow_inputs" : ["list of data_flow_notebook_keys this agent reads from"],
    "llm_prompt" (only for llm agent): "descriptive prompt containing Core domain expertise , Problem-solving approach , Response logic", (just keep  prompt, not the output format)
    "data_flow_outputs": ["list of data_flow_notebook_keys this agent writes to and reads from"],
    "validation_prompt" (only for validator) : "detailed Validation criteria", (just keep  validation criteria, not the output format)
    "deligation_prompt" (only for deligator) : "detailed deligation criteria", (just keep  deligation criteria, not the output format)
    "available_deligation" (only for deligator):["list of agent ids to which connector can deligate tasks"]
}},
(next agents)
],

"data_flow_notebook_keys" : [keep all relevant keys for proper data flow. example:- trigger_output, validator_3, iterator_4, meeting_link_3, etc. ] (keep unique keys only. if id of agent is 3, then all data_flow_output names of this agent will end with _3. example:-  meeting_link_3, etc. )

}}


Deligation Rules:
Can delegate tasks to previous relevant agents only
use delegation only if required, example :- if there are 2 agents - codeer_llm, log_summarizer, then a deligator after that. deligator check summarized_logs and delegate back to coder_llm agent if summarized_logs has some errors. 
try keep no. of delegations to minimum, and only if required.
dont keep deligator if not asked by user.

Notebook structure:
Shared dictionary with entries fom multiple agents
Each agent must explicitly declare read/write fields
Preserve chain-of-thought outputs


Trigger to starrt the workflow :-
{trigger["name"]} : {trigger["description"]} . outputs : {trigger["output"]}
every trigger output will be saved to the data_flow_notebook["trigger_output"] if available. if output from trigger not available, then first agent will directly start the workflow
Available tools:- 
{to_embed_composio}

TOOLS WITHOUT ACTIONS:-
{to_embed_other}
IMPORTANT : STRICTLY USE ABOVE TOOLS AND ACTIONS ONLY, NO MATTER THE USER'S PROBLEM IS SOLVED OR NOT! DON'T CREATE ANY NON EXISTING TOOL OR ACTION! KEEP ONLY THOSE TOOLS/ACTIONS WHICH WILL EXACTLY SOLVE USER'S PROBLEM.
IMPORTANT : PLEASE KEEP ONLY THOSE INPUT PARAMETERS OF ABOVE FUNCTIONS IN CONFIG INPUTS , WHOSE VALUES CANNOT BE FOUND FROM PREVIOUS AGENT OUTPUTS (data_flow_notebook). 


available connectors:-
1. VALIDATOR (conditional connector). inputs : [validation_prompt , output from previous agent]. outputs : {{validator_p (bool) (p is the id, value will be true if validation is true)}}
2. ITERATOR . inputs: [list_of_something]. output : [list_element (one at a time)] (use this when need to pass something to next tools one by one from a list. use iterator just after the tool which returns a list of elements)
3. DELIGATOR. inputs :[deligation_prompt , output of previous agents ]. outputs : {{to_deligate_from_p (bool) : True/False , deligation_p : {{agent_id : id of agent to which task is to be deligated, changes_required : "detailed explaination of what changes are required"}}}} 
(use deligator to execute a set of agents repeatedly until a condition is met.)

*note -> never use if-else to check if any element available in iterator. iterator handles full process of sending each element to next agents.
*note -> don't mix delegation and validation. both serve different purposes. use delegation only if required , and use validation for checking conditions.

available llms:-
1. CODER : code generation. input : llm_prompt. output : {{"code":generated_code, "language":language of code}}.
2. AI : generalized multipurpose llm for general text generation. input : llm_prompt. output : generated content (all required outputs in json format)


SOME RULES TO BE FOLLOWED STRICTLY :-

1. I already know the trigger, so don't give trigger, trigger is not a tool, so find the tools which will be used strictly after the trigger. example if using gmail trigger ,then no need to use gmail_search_mail.
2. IF TRIGGER RETURNS ANY OUTPUT, THEN THE FIRST AGENT MAY BE LLM, IT SHOULD TAKE INPUT FROM THE TRIGGER'S OUTPUT (data_flow_notebook["trigger_output"]) and extract the required information from it.
3. REMEMBER, MANUAL_TRIGGER HAS NO OUTPUTS. IT IS JUST USED TO START THE WORKFLOW WITH EMPTY data_flow_notebook.
4. Strictly make sure that config inputs will be included only if that input cannot be found out from previous tool outputs !! 
5. Must use iterator if you need to pass something to next tools one by one from previous output.
6. return a output in json format which will be used to execute the workflow, given the user query. No preambles or postambles are required. Keep all strings in double quotes.
"""
# embed different things in tool_finder prompt
    print("prompt:-\n",tool_finder,"\n")
    # response = groq.chat.completions.create(
    #     messages=[
    #         {
    #             "role": "system",
    #             "content": str(tool_finder)                    #  USE DEEPSEEK HERE

    #         },
    #         {
    #             "role": "user",
    #             "content": query.query,
    #         },
    #     ],
    #     model="llama-3.3-70b-versatile",
    #     temperature=1,    
    #     # Streaming is not supported in JSON mode
    #     stream=False,
    #     # Enable JSON mode by setting the response format
    # )

    # print(chat_completion)
    loop = asyncio.get_event_loop()
    def call_openai_sync():
        return client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": tool_finder},
                {"role": "user", "content": f"WORKFLOW TO CREATE :- {query.query}"},
            ],
            stream=False,
            temperature=0
        )

    response = await loop.run_in_executor(None, call_openai_sync)
    
    print("TOOLS NEEDED EXCEPT TRIGGERS:-",response.choices[0].message.content[7:-3],"\n")
    tools=json.loads(response.choices[0].message.content[7:-3])
    # for tool in tools["workflow"]:
    #     if tool["type"] == "tool" and tool["name"].upper() in composio_tools:
    #         class_name = globals().get(tool["name"].upper())
    #         if class_name:
    #             method_name = tool["tool_action"]
    #             if hasattr(class_name, method_name):
    #                 method = getattr(class_name, method_name)
    #                 signature = inspect.signature(method)
    #                 required_params = set(signature.parameters.keys()) - {"self"}
    #                 config_inputs_keys = set(tool.get("config_inputs", {}).keys())
    #                 data_flow_inputs_keys = set(tool.get("data_flow_inputs", []))
    #                 missing_params = required_params - (config_inputs_keys | data_flow_inputs_keys)

    #                 # Prepare the sets for LLM
    #                 llm_prompt = f"""
    #                 You are an expert in understanding input parameters of a function : {method_name} Given the following sets:
    #                 1. Required Parameters: {list(required_params)}
    #                 2. Config Inputs Keys: {list(config_inputs_keys)}
    #                 3. Data Flow Inputs Keys: {list(data_flow_inputs_keys)}

    #                 Identify the missing parameters from the Required Parameters set that are not present in the other two sets. 
    #                 If a parameter is missing but might be available within the parameters of other sets (means any of the parameters in other sets may have a similar name, or similar context), then do not include thet pseudo missing parameter in the missing list. 
    #                 Return only the list of truly missing parameter names in python list format . keep all elements in double quotes:
    #                 ["p1","p2"]   
    #                 no preambles or postambles.
    #                 """

    #                 # Query the Gemini LLM
    #                 missing_params =  gemini_chain.invoke({
    #                     "prompt": llm_prompt
    #                 })

    #                 # Parse the response
    #                 if missing_params[0] == "`":
    #                     try:
    #                         missing_params = json.loads(missing_params[10:-4])
    #                     except:
    #                         missing_params = json.loads(missing_params[10:-3])
    #                 else:

    #                     missing_params = json.loads(missing_params)

    #                 # Update the tool's config_inputs dictionary
    #                 for param in missing_params:
    #                     tool.setdefault("config_inputs", {})[param] = ""

        # else:
        #     for oth_tool in oth_tools:
        #         if oth_tool["name"].upper() == tool["name"].upper():
        #             required_params = set(oth_tool.get("inputs", []))
        #             config_inputs_keys = set(tool.get("config_inputs", {}).keys())
        #             data_flow_inputs_keys = set(tool.get("data_flow_inputs", []))
        #             missing_params = required_params - (config_inputs_keys | data_flow_inputs_keys)
        #             # Prepare the sets for LLM
        #             llm_prompt = f"""
        #             You are an expert in understanding input parameters of a function : {tool['name'].upper()} Given the following sets:
        #             1. Required Parameters: {list(required_params)}
        #             2. Config Inputs Keys: {list(config_inputs_keys)}
        #             3. Data Flow Inputs Keys: {list(data_flow_inputs_keys)}

        #             Identify the missing parameters from the Required Parameters set that are not present in the other two sets. 
        #             If a parameter is missing but might be available within the parameters of other sets (means any of the parameters in other sets may have a similar name, or similar context), then do not include thet pseudo missing parameter in the missing list. 
        #             Return only the list of truly missing parameter names in python list format . keep all elements in double quotes:
        #             ["p1","p2"]   
        #             no preambles or postambles.
        #             """

        #             # Query the Gemini LLM
        #             missing_params =  gemini_chain.invoke({
        #                 "prompt": llm_prompt
        #             })

        #             # Parse the response
        #             if missing_params[0] == "`":
        #                 try:
        #                     missing_params = json.loads(missing_params[10:-4])
        #                 except:
        #                     missing_params =json.loads(missing_params[10:-3])
        #             else:

        #                 missing_params = json.loads(missing_params)

        #             # Update the tool's config_inputs dictionary
        #             for param in missing_params:
        #                 tool.setdefault("config_inputs", {})[param] = ""
    
    # Add the new entry to prism.json
    prism_entry = {"query": query.query, "prompt": tool_finder+"\nWORKFLOW TO CREATE:"+query.query, "response": tools}
    prism_file_path = "prism.json"
    if os.path.exists(prism_file_path):
        with open(prism_file_path, "r") as prism_file:
            prism_data = json.load(prism_file)
    else:
        prism_data = []
    prism_data.append(prism_entry)
    with open(prism_file_path, "w") as prism_file:
        json.dump(prism_data, prism_file, indent=2)





    tools["trigger"]=trigger
    tools["active"]=False

    if query.flag:
        # Update the workflow in DynamoDB
        tools["workflow_id"]=query.wid
        tools["unavailable"]=ret_un
        try:
            response =  db_client.update_item(
                TableName='users',
                Key={'clerk_id': {'S': user_id}},
                UpdateExpression="SET workflows.#wid = :new_workflow",
                ExpressionAttributeNames={
                    '#wid': query.wid  # Using workflow_id as the key
                },
                ExpressionAttributeValues={
                    ':new_workflow': {
                        'M': {
                            'json': {'S': json.dumps(tools,indent=2)},
                            'prompt': {'S': query.query}
                        }
                    }
                },
                ReturnValues="UPDATED_NEW"
            )
            print("Update succeeded:", response)
        except Exception as e:
            print("Error updating item:", e)
    else:
        tools["workflow_id"] = str(uuid.uuid4())
        tools["unavailable"]=ret_un
        try:
            # First, ensure workflows exists
            db_client.update_item(
                TableName='users',
                Key={'clerk_id': {'S': user_id}},
                UpdateExpression="SET workflows = if_not_exists(workflows, :empty_map)",
                ExpressionAttributeValues={
                    ':empty_map': {'M': {}}  # Initialize as an empty map if missing
                }
            )

            # Now, update workflows by adding a new key-value pair
            response =  db_client.update_item(
                TableName='users',
                Key={'clerk_id': {'S': user_id}},
                UpdateExpression="SET workflows.#wid = :new_workflow",
                ExpressionAttributeNames={
                    '#wid': tools["workflow_id"]  # New key inside workflows
                },
                ExpressionAttributeValues={
                    ':new_workflow': {
                        'M': {
                            'json': {'S': json.dumps(tools, indent=2)},
                            'prompt': {'S': query.query}
                        }
                    }
                },
                ReturnValues="UPDATED_NEW"
            )

            print("Update succeeded:", response)
        except Exception as e:
            print("Error updating item:", e)

    return {"response":tools}
    