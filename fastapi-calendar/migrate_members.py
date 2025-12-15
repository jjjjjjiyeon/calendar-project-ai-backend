from database import calendar_collection

for cal in calendar_collection.find():
    if cal.get("members") and isinstance(cal["members"][0], str):
        new_members = [{"email": email, "role": "viewer"} for email in cal["members"]]
        calendar_collection.update_one({"_id": cal["_id"]}, {"$set": {"members": new_members}})
        print(f"✅ Updated calendar {cal['_id']}")
