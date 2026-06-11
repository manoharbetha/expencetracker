from typing import List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user
from app.db.mongodb import get_db

router = APIRouter()

class TokenRequest(BaseModel):
    fcmToken: str

def serialize_notif(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "userId": str(doc.get("userId", doc.get("user_id"))),
        "title": doc.get("title", ""),
        "message": doc.get("message", ""),
        "type": doc.get("type", "info"),
        "isRead": doc.get("isRead", doc.get("read", False)),
        "createdAt": doc.get("createdAt").isoformat() if hasattr(doc.get("createdAt"), "isoformat") else str(doc.get("createdAt")),
    }

@router.post("/token", status_code=201)
async def store_token(payload: TokenRequest, u: dict = Depends(get_current_user)):
    db = get_db()
    # Upsert token to prevent duplicates
    await db.notification_tokens.update_one(
        {"userId": u["id"], "fcmToken": payload.fcmToken},
        {"$set": {"userId": u["id"], "fcmToken": payload.fcmToken, "createdAt": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"message": "Token stored successfully"}

@router.get("", response_model=List[Dict[str, Any]])
async def get_notifications(u: dict = Depends(get_current_user)):
    db = get_db()
    # Return sorted by newest
    docs = await db.notifications.find({"userId": u["id"]}).sort("createdAt", -1).to_list(100)
    # Also support old 'user_id' just in case
    old_docs = await db.notifications.find({"user_id": u["id"]}).sort("createdAt", -1).to_list(100)
    all_docs = docs + old_docs
    all_docs.sort(key=lambda x: x.get("createdAt", datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
    return [serialize_notif(d) for d in all_docs[:100]]

@router.put("/{nid}/read")
async def mark_read(nid: str, u: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(nid):
        raise HTTPException(400, "Invalid notification ID")
        
    res = await get_db().notifications.update_one(
        {"_id": ObjectId(nid), "$or": [{"userId": u["id"]}, {"user_id": u["id"]}]},
        {"$set": {"isRead": True, "read": True, "updatedAt": datetime.now(timezone.utc)}}
    )
    if res.modified_count == 0:
        raise HTTPException(404, "Notification not found")
    return {"message": "Marked as read"}

@router.delete("/{nid}")
async def delete_notification(nid: str, u: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(nid):
        raise HTTPException(400, "Invalid notification ID")
        
    res = await get_db().notifications.delete_one(
        {"_id": ObjectId(nid), "$or": [{"userId": u["id"]}, {"user_id": u["id"]}]}
    )
    if res.deleted_count == 0:
        raise HTTPException(404, "Notification not found")
    return {"message": "Deleted successfully"}
