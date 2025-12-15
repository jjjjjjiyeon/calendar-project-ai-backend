from fastapi import APIRouter, HTTPException
from models.event_model import Event
from database import event_collection
from bson import ObjectId

router = APIRouter()

@router.post("/")
def create_event(event: Event):
    try:
        event_dict = event.dict()
        result = event_collection.insert_one(event_dict)

        # MongoDB는 _id를 자동 생성해줌 → str로 변환
        event_dict["_id"] = str(result.inserted_id)

        return {
            "message": "Event created successfully",
            "data": event_dict
        }

    except Exception as e:
        print("❌ Error:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/")
def get_events():
    events = []
    for event in event_collection.find():
        events.append({
            "_id": str(event["_id"]),
            "title": event["title"],
            "date": event["date"],
            "description": event.get("description", "")
        })
    return {
        "message": "Events fetched successfully",
        "data": events
    }

@router.delete("/{id}")
def delete_event(id: str):
    try:
        result = event_collection.delete_one({"_id": ObjectId(id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")

        return {
            "message": "Event deleted successfully",
            "event_id": id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@router.put("/{id}")
def update_event(id: str, updated_event: Event):
    try:
        # dict로 변환
        update_data = updated_event.dict()

        # 업데이트 시도
        result = event_collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")

        return {
            "message": "Event updated successfully",
            "event_id": id,
            "updated_fields": update_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")