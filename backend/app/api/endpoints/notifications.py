from typing import List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException


from app.core.security import get_current_user
from app.db.mongodb import get_db

router = APIRouter()



def serialize_notif(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "userId": str(doc.get("userId", doc.get("user_id"))),
        "title": doc.get("title", ""),
        "message": doc.get("message", ""),
        "type": doc.get("type", "info"),
        "category": doc.get("category", "Finance"),
        "priority": doc.get("priority", "Medium"),
        "isRead": doc.get("isRead", doc.get("read", False)),
        "createdAt": doc.get("createdAt").isoformat() if hasattr(doc.get("createdAt"), "isoformat") else str(doc.get("createdAt")),
    }



def get_priority_weight(priority: str) -> int:
    p = (priority or "Medium").upper()
    if p == "HIGH":
        return 2
    if p == "MEDIUM":
        return 1
    return 0

@router.get("", response_model=List[Dict[str, Any]])
async def get_notifications(u: dict = Depends(get_current_user)):
    from datetime import datetime, timezone, timedelta
    db = get_db()
    
    # Cleanup read notifications older than 30 days for this user
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    await db.notifications.delete_many({
        "$or": [{"userId": u["id"]}, {"user_id": u["id"]}],
        "$or": [{"isRead": True}, {"read": True}],
        "createdAt": {"$lt": thirty_days_ago}
    })

    # Fetch user's notifications
    docs = await db.notifications.find({"userId": u["id"]}).to_list(100)
    old_docs = await db.notifications.find({"user_id": u["id"]}).to_list(100)
    
    all_docs = docs + old_docs
    seen = set()
    deduped_docs = []
    for d in all_docs:
        d_id = str(d["_id"])
        if d_id not in seen:
            seen.add(d_id)
            deduped_docs.append(d)

    # Sort notifications:
    # 1. Newest first
    deduped_docs.sort(key=lambda x: x.get("createdAt") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    # 2. Priority descending
    deduped_docs.sort(key=lambda x: get_priority_weight(x.get("priority", "Medium")), reverse=True)
    # 3. Unread first (False < True)
    deduped_docs.sort(key=lambda x: bool(x.get("isRead", x.get("read", False))))

    return [serialize_notif(d) for d in deduped_docs[:100]]

@router.put("/read-all")
async def mark_all_read(u: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.notifications.update_many(
        {"$or": [{"userId": u["id"]}, {"user_id": u["id"]}], "isRead": {"$ne": True}},
        {"$set": {"isRead": True, "read": True, "updatedAt": datetime.now(timezone.utc)}}
    )
    return {"message": f"Marked {res.modified_count} notifications as read"}

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


