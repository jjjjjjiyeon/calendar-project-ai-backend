from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["calendar"]
event_collection = db["events"]
user_collection = db["users"]
calendar_collection = db["calendars"]