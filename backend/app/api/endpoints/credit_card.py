from datetime import datetime, timezone
from fastapi import APIRouter, Body, Depends, HTTPException
from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.schemas import CreditCardCreate

router = APIRouter()

@router.get("")
async def get_credit_card(u: dict = Depends(get_current_user)):
    db = get_db()
    card = await db.credit_cards.find_one({"userId": u["id"]})
    if not card:
        return None
    
    # Calculate currentUsage dynamically from expenses
    pipeline = [
        {"$match": {"user_id": u["id"], "paymentMethod": "Credit Card"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    res = await db.expenses.aggregate(pipeline).to_list(1)
    current_usage = float(res[0]["total"]) if res else 0.0
    
    return {
        "id": str(card["_id"]),
        "cardName": card.get("cardName", ""),
        "creditLimit": float(card.get("creditLimit", 0.0)),
        "currentUsage": round(current_usage, 2),
        "billingDate": int(card.get("billingDate", 1)),
        "dueDate": int(card.get("dueDate", 1)),
        "createdAt": card.get("createdAt").isoformat() if hasattr(card.get("createdAt"), "isoformat") else str(card.get("createdAt"))
    }

@router.post("")
async def upsert_credit_card(
    card_data: CreditCardCreate = Body(...),
    u: dict = Depends(get_current_user)
):
    db = get_db()
    now = datetime.now(timezone.utc)
    
    doc = {
        "userId": u["id"],
        "cardName": card_data.cardName,
        "creditLimit": card_data.creditLimit,
        "billingDate": card_data.billingDate,
        "dueDate": card_data.dueDate,
        "updatedAt": now
    }
    
    await db.credit_cards.update_one(
        {"userId": u["id"]},
        {"$set": doc, "$setOnInsert": {"createdAt": now}},
        upsert=True
    )
    
    card = await db.credit_cards.find_one({"userId": u["id"]})
    if not card:
        raise HTTPException(status_code=500, detail="Failed to retrieve credit card after save.")
    
    # Calculate currentUsage dynamically
    pipeline = [
        {"$match": {"user_id": u["id"], "paymentMethod": "Credit Card"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    res_agg = await db.expenses.aggregate(pipeline).to_list(1)
    current_usage = float(res_agg[0]["total"]) if res_agg else 0.0
    
    return {
        "id": str(card["_id"]),
        "cardName": card.get("cardName", ""),
        "creditLimit": float(card.get("creditLimit", 0.0)),
        "currentUsage": round(current_usage, 2),
        "billingDate": int(card.get("billingDate", 1)),
        "dueDate": int(card.get("dueDate", 1)),
        "createdAt": card.get("createdAt").isoformat() if hasattr(card.get("createdAt"), "isoformat") else str(card.get("createdAt"))
    }
