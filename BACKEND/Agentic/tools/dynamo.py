import boto3
from dotenv import load_dotenv  
import os
load_dotenv()


os.environ['AWS_ACCESS_KEY_ID'] = os.getenv("AWS_ACCESS_KEY_ID")
os.environ['AWS_SECRET_ACCESS_KEY'] = os.getenv("AWS_SECRET_ACCESS_KEY")

try:
    db_client = boto3.client("dynamodb",region_name='us-east-1')
    print("success dynamo")
except ConnectionError as e:
    raise ConnectionError(f"Failed to connect to DynamoDB: {str(e)}")

try:
    s3_client = boto3.client("s3", region_name='us-east-1')
    print("success s3")
except ConnectionError as e:
    raise ConnectionError(f"Failed to connect to S3: {str(e)}")