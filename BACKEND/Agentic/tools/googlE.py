from google_auth_oauthlib.flow import Flow
from dotenv import load_dotenv
import os
import requests
from fastapi import HTTPException
from datetime import datetime, timedelta, timezone
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from .dynamo import db_client
from boto3.dynamodb.types import TypeSerializer
from googleapiclient.discovery import build

load_dotenv()

serializer = TypeSerializer()
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
flow = Flow.from_client_config(
    {
        "web": {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uris": [REDIRECT_URI],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    },
    scopes=["https://www.googleapis.com/auth/gmail.readonly"]
)
flow.redirect_uri = REDIRECT_URI

def get_user_email(credentials):
    """Fetch the user's email address using their OAuth2 credentials."""
    url = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    headers = {
        "Authorization": f"Bearer {credentials.token}"
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        user_info = response.json()
        return user_info.get("email")  # ✅ Returns the email address
    else:
        print("Error fetching email:", response.json())
        return None


def save_google_credentials(user_id,mail, credentials):
    """Store credentials in the database"""
   

    # try:
    #     with open("/home/aryan/BABLU/Agentic/tools/credentials.json", "r") as file:
    #         data = json.load(file)
    # except (FileNotFoundError, json.JSONDecodeError):
    #     data = {}
    
    user_data = db_client.get_item(
        TableName="custom_credentials",
        Key={"mail": {"S": mail}}
    )
    
    gt_cred = user_data.get("Item", {}).get("gmailtrigger", {}).get("S", {}) 
    if not gt_cred:
        print("No credentials found for this user.")
        print(type(credentials))
        gt_cred=credentials
    
    gt_cred_dynamo = serializer.serialize(gt_cred)
    try:
        response = db_client.update_item(
            TableName="custom_credentials",
            Key={'mail': {'S': mail}},
            UpdateExpression="SET gmailtrigger = :gt_cred, user_id = :user_id",
            ExpressionAttributeValues={
            ':gt_cred':  gt_cred_dynamo,
            ':user_id': {'S': user_id}
            },
            ReturnValues="UPDATED_NEW"
        )
        print("Update succeeded:", response)
    except Exception as e:
        print("Error updating item:", e)

    

    


def get_fresh_google_credentials(mail):
    
    user_data = db_client.get_item(
        TableName="custom_credentials",
        Key={"mail": {"S": mail}}
    )
    
    gt_cred = user_data.get("Item", {}).get("gmailtrigger", {}).get("S", {})
    user_id = user_data.get("Item", {}).get("user_id", {}).get("S", "")
    # with open("/home/aryan/BABLU/Agentic/tools/credentials.json", "r") as file:
    #     credentials = json.load(file)[user_id]
    if not gt_cred:
        raise HTTPException(status_code=401, detail="Gmail Trigger authentication required")
    else:
        credentials = gt_cred
    if type(credentials)==str:
        credentials=json.loads(credentials)
    
    print(type(credentials))
    creds=Credentials(**credentials)
    print(creds)
    # print(creds.valid)
    # if creds.expired and creds.refresh_token:
    creds.refresh(Request())  # Refresh the token
    save_google_credentials(user_id,mail, creds.to_json())
    return creds,user_id
    


def stop_gmail_watch(service, user_id="me"):
    try:
        response = service.users().stop(userId=user_id).execute()
        print("🛑 Gmail watch stopped successfully.")
    except Exception as e:
        print("❌ Failed to stop Gmail watch:", str(e))



def setup_watch(mail: str):
    creds ,user_id= get_fresh_google_credentials(mail)
    headers = {"Authorization": f"Bearer {creds.token}"}

    watch_request = {
        "labelIds": ["INBOX"],
        "topicName": "projects/sigmoyd/topics/gmail-notifications"
    }

    response = requests.post(
        "https://www.googleapis.com/gmail/v1/users/me/watch",
        headers=headers,
        json=watch_request
    )
    
    # if "expiration" in response.json():
    #     expiration_time = datetime.fromtimestamp(int(response.json()["expiration"]) / 1000, timezone.UTC)
    #     print(f"Watch set up for user {user_id}. Expires at {expiration_time}")
        
    #     # Calculate timestamp 5 minutes before expiration
    #     refresh_time = expiration_time - timedelta(minutes=5)
    #     refresh_timestamp = refresh_time.strftime("%Y-%m-%d %H:%M")
        
        # # Initialize list for this timestamp if it doesn't exist
        # if refresh_timestamp not in user_watch_sessions:
        #     user_watch_sessions[refresh_timestamp] = []
            
        # # Add user watch task to the list
        # user_watch_sessions[refresh_timestamp].append({
        #     "user_id": user_id,
        #     "type": "gmail",
        # })
    
    return response.json()



import base64
import json
import binascii


def extract_email(email_data):
    email_data_json = json.dumps(email_data, indent=4)
    print(email_data_json)
    # Extract sender email
    sender_email = next((h["value"] for h in email_data["payload"]["headers"] if h["name"] == "From"), "Unknown Sender")
    # Extract subject
    subject = next((h["value"] for h in email_data["payload"]["headers"] if h["name"] == "Subject"), "No Subject")

    body = ""  # Will store extracted email body
    attachments = {}  # Dictionary to store attachments

    def decode_base64(data):
        """ Decodes base64 safely, handling errors """
        try:
            return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
        except (binascii.Error, UnicodeDecodeError):
            print("⚠️ Warning: Invalid Base64 data")
            return ""

    def process_parts(parts):
        """ Recursively processes parts of the email """
        nonlocal body

        for part in parts:
            mime_type = part.get("mimeType", "")
            
            # Handle email body
            if mime_type in ["text/plain", "text/html"]:
                if "data" in part.get("body", {}):
                    decoded_text = decode_base64(part["body"]["data"])
                    if mime_type == "text/plain":  # Prefer plain text over HTML
                        body += decoded_text + "\n"
                    elif mime_type == "text/html" and not body:  # Use HTML only if no plain text is available
                        body = decoded_text

            # Handle multipart (nested structure)
            elif mime_type.startswith("multipart/") and "parts" in part:
                process_parts(part["parts"])

            # Handle attachments
            if "filename" in part and part["filename"]:  # Attachment found
                if "data" in part.get("body", {}):
                    file_data = base64.urlsafe_b64decode(part["body"]["data"])
                    attachments[part["filename"]] = file_data  # Store raw bytes

    # Process the email payload
    if "data" in email_data["payload"]["body"]:  # Simple email (no attachments)
        body = decode_base64(email_data["payload"]["body"]["data"])
    else:
        process_parts(email_data["payload"].get("parts", []))

    # Print extracted email content
    print("📧 Sender Email:", sender_email)
    print("📌 Subject:", subject)
    print("📜 Body:", body[:500])  # Print only the first 500 chars for preview
    print("📎 Attachments:", list(attachments.keys()))

    # Save attachments to files
    for filename, content in attachments.items():
        with open(filename, "wb") as f:
            f.write(content)
        print(f"✅ Saved attachment: {filename}")

    return {
        "sender_email": sender_email,
        "subject": subject,
        "body": body,
        "attachments": list(attachments.keys()),
    }



if __name__=="__main__":
    # print(setup_watch("user_2rm0Z6dEHfkkTZbBGeiV7x5PCxW"))
    # save_google_credentials("me", {"token":"token", "refresh_token":"refresh_token
    # email_data={}
    # print(type(email_data))
    # # Convert email data to JSON with indent 4 and print
    # email_data_json = json.dumps(email_data, indent=4)
    # print(email_data_json)
    # extract_email(email_data)
    # Usage (assuming you already have authorized `service`)
    creds,user_id= get_fresh_google_credentials("aryan22102@iiitnr.edu.in")
    service = build('gmail', 'v1', credentials=creds)
    stop_gmail_watch(service)