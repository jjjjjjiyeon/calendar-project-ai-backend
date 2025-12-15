from fastapi import APIRouter, HTTPException, Depends, Body
from models.calendar_model import Calendar
from database import calendar_collection
from bson import ObjectId
from utils.auth_utils import get_current_user
import secrets 
from models.calendar_model import RoleUpdate


router = APIRouter(
    prefix="/api/calendars",
    tags=["Calendars"]
)

@router.post("/")
def create_calendar(calendar: Calendar):
    calendar_dict = calendar.dict()
    result = calendar_collection.insert_one(calendar_dict)
    calendar_dict["_id"] = str(result.inserted_id)
    return {
        "message": "Calendar created successfully",
        "data": calendar_dict
    }

@router.get("/")
def get_calendars():
    calendars = []
    for cal in calendar_collection.find():
        calendars.append({
            "_id": str(cal["_id"]),
            "name": cal["name"],
            "description": cal.get("description", "")
        })
    return {
        "message": "Calendars fetched successfully",
        "data": calendars
    }

@router.put("/{id}")
def rename_calendar(id: str, calendar: Calendar):
    result = calendar_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": calendar.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return {"message": "Calendar updated successfully"}

@router.delete("/{id}")
def delete_calendar(id: str):
    result = calendar_collection.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return {"message": "Calendar deleted successfully"}

@router.post("/{id}/members")
def add_member(id: str, email: str = Body(...), current_user: dict = Depends(get_current_user)):
    calendar = calendar_collection.find_one({"_id": ObjectId(id)})

    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")

    if calendar["owner"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Only owner can add members")

    if email in calendar.get("members", []):
        raise HTTPException(status_code=400, detail="Member already exists")

    calendar_collection.update_one(
        {"_id": ObjectId(id)},
        {"$addToSet": {"members": email}}
    )

    return {"message": "Member added successfully", "email": email}

@router.delete("/{id}/members")
def remove_member(
    id: str,
    member_email: str = Body(...),
    current_user: dict = Depends(get_current_user)
):
    calendar = calendar_collection.find_one({"_id": ObjectId(id)})

    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")

    if calendar["owner"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Only owner can remove members")

    calendar_collection.update_one(
        {"_id": ObjectId(id)},
        {"$pull": {"members": member_email}}
    )

    return {"message": f"{member_email} removed from calendar"}

@router.post("/{id}/share")
def generate_share_link(id: str, current_user: dict = Depends(get_current_user)):
    calendar = calendar_collection.find_one({"_id": ObjectId(id)})

    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")

    if calendar["owner"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Only the owner can generate share link")

    # 새 토큰 생성
    token = secrets.token_urlsafe(16)

    calendar_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"share_token": token}}
    )

    return {
        "message": "Share link generated",
        "share_token": token
    }

@router.post("/join/{token}")
def join_by_token(token: str, current_user: dict = Depends(get_current_user)):
    calendar = calendar_collection.find_one({"share_token": token})

    if not calendar:
        raise HTTPException(status_code=404, detail="Invalid or expired token")

    email = current_user["email"]

    # 이미 멤버인지 확인
    if email == calendar["owner"] or email in calendar.get("members", []):
        return {"message": "Already a member or owner"}

    calendar_collection.update_one(
        {"_id": calendar["_id"]},
        {"$addToSet": {"members": email}}
    )

    return {
        "message": "Joined calendar successfully",
        "calendar_id": str(calendar["_id"])
    }

@router.get("/{id}/share")
def get_share_info(id: str, current_user: dict = Depends(get_current_user)):
    calendar = calendar_collection.find_one({"_id": ObjectId(id)})

    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")

    if calendar["owner"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Only the owner can view share link")

    share_token = calendar.get("share_token")
    if not share_token:
        return {"message": "This calendar is not shared yet."}

    return {
        "message": "Share link retrieved",
        "share_token": share_token
    }

@router.delete("/{id}/share")
def revoke_share_link(id: str, current_user: dict = Depends(get_current_user)):
    calendar = calendar_collection.find_one({"_id": ObjectId(id)})

    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")

    if calendar["owner"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Only the owner can revoke the share link")

    calendar_collection.update_one(
        {"_id": ObjectId(id)},
        {"$unset": {"share_token": ""}}
    )

    return {"message": "Share link revoked"}

@router.get("/{id}/members")
def get_calendar_members(id: str, current_user: dict = Depends(get_current_user)):
    calendar = calendar_collection.find_one({"_id": ObjectId(id)})

    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")

    # owner + members 리스트 합치기
    members = [calendar["owner"]] + calendar.get("members", [])

    return {
        "message": "Members fetched successfully",
        "members": members
    }


@router.put("/{id}/members/{member_email}")
def update_member_role(
    id: str,
    member_email: str,
    update: RoleUpdate,
    current_user: dict = Depends(get_current_user)
):
    new_role = update.role
    calendar = calendar_collection.find_one({"_id": ObjectId(id)})

    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")

    if calendar["owner"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Only owner can update roles")

    updated = False
    for member in calendar.get("members", []):
        if isinstance(member, dict) and member["email"] == member_email:
            member["role"] = new_role
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Member not found")

    calendar_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"members": calendar["members"]}}
    )

    return {
        "message": "Role updated successfully",
        "member": member_email,
        "new_role": new_role
    }


@router.delete("/{id}/leave")
def leave_calendar(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    calendar = calendar_collection.find_one({"_id": ObjectId(id)})

    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")

    email = current_user["email"]

    if email == calendar["owner"]:
        raise HTTPException(status_code=400, detail="Owner cannot leave the calendar")

    if email not in calendar.get("members", []):
        raise HTTPException(status_code=404, detail="You are not a member of this calendar")

    calendar_collection.update_one(
        {"_id": ObjectId(id)},
        {
            "$pull": {"members": email},
            "$unset": {f"roles.{email}": ""}
        }
    )

    return {"message": "You left the calendar"}
