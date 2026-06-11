from datetime import datetime, timezone
from typing import Any, Dict, List
from bson import ObjectId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorCollection
from pymongo import DESCENDING, ReturnDocument

def oid(val: str) -> ObjectId:
    if not ObjectId.is_valid(val):
        raise HTTPException(status_code=404, detail="Not found")
    return ObjectId(val)

def normalize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in payload.items():
        if v is None:
            continue
        if hasattr(v, "isoformat") and not isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out

def serialize_doc(doc: dict) -> dict:
    out: Dict[str, Any] = {}
    for k, v in doc.items():
        if k in ("user_id", "hashed_password"):
            continue
        if k == "_id":
            out["id"] = str(v)
        elif isinstance(v, ObjectId):
            out[k] = str(v)
        elif hasattr(v, "isoformat"):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out

async def create_doc(col: AsyncIOMotorCollection, uid: str, data: Dict[str, Any]) -> dict:
    now = datetime.now(timezone.utc)
    doc = {**normalize_payload(data), "user_id": uid, "createdAt": now, "updatedAt": now}
    res = await col.insert_one(doc)
    created = await col.find_one({"_id": res.inserted_id})
    return serialize_doc(created)

async def list_docs(
    col: AsyncIOMotorCollection,
    uid: str,
    sort_field: str = "createdAt",
    sort_dir: int = DESCENDING,
    limit: int = 200,
) -> List[dict]:
    cursor = col.find({"user_id": uid}).sort(sort_field, sort_dir).limit(limit)
    return [serialize_doc(d) async for d in cursor]

async def get_doc(col: AsyncIOMotorCollection, uid: str, item_id: str) -> dict:
    doc = await col.find_one({"_id": oid(item_id), "user_id": uid})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_doc(doc)

async def update_doc(
    col: AsyncIOMotorCollection, uid: str, item_id: str, data: Dict[str, Any]
) -> dict:
    update = normalize_payload(data)
    update["updatedAt"] = datetime.now(timezone.utc)
    res = await col.find_one_and_update(
        {"_id": oid(item_id), "user_id": uid},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_doc(res)

async def delete_doc(col: AsyncIOMotorCollection, uid: str, item_id: str) -> None:
    res = await col.delete_one({"_id": oid(item_id), "user_id": uid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
