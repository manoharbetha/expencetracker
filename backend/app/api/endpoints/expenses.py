from typing import Optional, Any, Dict
from fastapi import APIRouter, Body, Depends
from pymongo import DESCENDING
from bson import ObjectId
from datetime import datetime, timezone, timedelta

from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.db.crud import create_doc, get_doc, update_doc, delete_doc, serialize_doc
from app.schemas import ExpenseCreate, ExpenseUpdate, MessageResponse
from app.services.fcm_service import send_to_user

router = APIRouter()

@router.post("", status_code=201)
async def create_expense(
    expense_data: ExpenseCreate = Body(...),
    u: dict = Depends(get_current_user),
) -> dict:
    db = get_db()
    doc = await create_doc(db.expenses, u["id"], expense_data.model_dump())
    if doc.get("amount") and doc.get("merchant"):
        await send_to_user(u["id"], "Expense Added", f"₹{doc['amount']} spent at {doc['merchant']}", "expense")
    elif doc.get("amount") and doc.get("description"):
        await send_to_user(u["id"], "Expense Added", f"₹{doc['amount']} spent on {doc['description']}", "expense")
    
    if doc.get("paymentMethod") == "Credit Card":
        await check_credit_card_notifications(u["id"], db)
        
    return doc

@router.get("")
async def list_expenses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    u: dict = Depends(get_current_user),
) -> dict:
    query: Dict[str, Any] = {"user_id": u["id"]}
    if category:
        query["category"] = category
    if payment_method:
        query["paymentMethod"] = payment_method
    if search:
        query["description"] = {"$regex": search, "$options": "i"}
    if start_date or end_date:
        date_filter: Dict[str, Any] = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        query["date"] = date_filter

    total = await get_db().expenses.count_documents(query)
    cursor = get_db().expenses.find(query).sort("date", DESCENDING).skip(skip).limit(limit)
    items = [serialize_doc(d) async for d in cursor]
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@router.get("/{expense_id}")
async def get_expense(expense_id: str, u: dict = Depends(get_current_user)) -> dict:
    return await get_doc(get_db().expenses, u["id"], expense_id)

@router.put("/{expense_id}")
async def update_expense(
    expense_id: str,
    expense_data: ExpenseUpdate = Body(...),
    u: dict = Depends(get_current_user),
) -> dict:
    db = get_db()
    orig = await db.expenses.find_one({"_id": ObjectId(expense_id), "user_id": u["id"]})
    
    updated = await update_doc(db.expenses, u["id"], expense_id, expense_data.model_dump())
    
    if (orig and orig.get("paymentMethod") == "Credit Card") or updated.get("paymentMethod") == "Credit Card":
        await check_credit_card_notifications(u["id"], db)
        
    return updated

@router.delete("/{expense_id}", response_model=MessageResponse)
async def delete_expense(expense_id: str, u: dict = Depends(get_current_user)) -> MessageResponse:
    db = get_db()
    orig = await db.expenses.find_one({"_id": ObjectId(expense_id), "user_id": u["id"]})
    
    await delete_doc(db.expenses, u["id"], expense_id)
    
    if orig and orig.get("paymentMethod") == "Credit Card":
        await check_credit_card_notifications(u["id"], db)
        
    return MessageResponse(message="Expense deleted successfully.")

async def check_credit_card_notifications(uid: str, db):
    card = await db.credit_cards.find_one({"userId": uid})
    if not card:
        return
    
    pipeline = [
        {"$match": {"user_id": uid, "paymentMethod": "Credit Card"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    res = await db.expenses.aggregate(pipeline).to_list(1)
    current_usage = float(res[0]["total"]) if res else 0.0
    limit = float(card.get("creditLimit", 0.0))
    if limit <= 0:
        return
    
    utilization = (current_usage / limit) * 100
    
    title = "Credit Card Alert"
    message = None
    notif_type = "credit_card"
    
    if utilization >= 100:
        message = "You have reached your credit limit."
    elif utilization >= 90:
        message = "You are close to your credit limit."
    elif utilization >= 70:
        message = "Your credit card utilization has exceeded 70%."
        
    if message:
        one_day_ago = datetime.now(timezone.utc) - timedelta(days=1)
        existing = await db.notifications.find_one({
            "userId": uid,
            "title": title,
            "message": message,
            "createdAt": {"$gte": one_day_ago}
        })
        if not existing:
            await send_to_user(uid, title, message, notif_type)
