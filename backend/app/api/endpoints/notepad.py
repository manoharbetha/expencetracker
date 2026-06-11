from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.db.mongodb import get_db

router = APIRouter()

class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1)
    estimatedPrice: float = Field(default=0)
    priority: str = Field(default="Medium")

class NoteUpdate(BaseModel):
    title: str | None = None
    estimatedPrice: float | None = None
    priority: str | None = None
    status: str | None = None

def serialize_note(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc["user_id"]),
        "title": doc.get("title", ""),
        "estimatedPrice": float(doc.get("estimatedPrice", 0)),
        "priority": doc.get("priority", "Medium"),
        "status": doc.get("status", "Pending"),
        "createdAt": doc.get("createdAt").isoformat() if hasattr(doc.get("createdAt"), "isoformat") else str(doc.get("createdAt")),
    }

@router.get("/", response_model=List[Dict[str, Any]])
async def get_notes(u: dict = Depends(get_current_user)):
    db = get_db()
    docs = await db.notepad.find({"user_id": u["id"]}).sort("createdAt", -1).to_list(100)
    return [serialize_note(d) for d in docs]

@router.post("/", response_model=Dict[str, Any])
async def create_note(payload: NoteCreate, u: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)
    new_note = {
        "user_id": u["id"],
        "title": payload.title,
        "estimatedPrice": payload.estimatedPrice,
        "priority": payload.priority,
        "status": "Pending",
        "createdAt": now,
        "updatedAt": now
    }
    res = await db.notepad.insert_one(new_note)
    new_note["_id"] = res.inserted_id
    return serialize_note(new_note)

@router.put("/{note_id}", response_model=Dict[str, Any])
async def update_note(note_id: str, payload: NoteUpdate, u: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    db = get_db()
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    res = await db.notepad.find_one_and_update(
        {"_id": ObjectId(note_id), "user_id": u["id"]},
        {"$set": update_data},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Note not found")
        
    return serialize_note(res)

@router.delete("/{note_id}")
async def delete_note(note_id: str, u: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid note ID")
        
    db = get_db()
    res = await db.notepad.delete_one({"_id": ObjectId(note_id), "user_id": u["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
        
    return {"status": "ok"}
