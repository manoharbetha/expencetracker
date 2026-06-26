from datetime import datetime, timezone
from fastapi import APIRouter, Body, Depends, HTTPException
from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.schemas import CreditCardCreate

router = APIRouter()

@router.get("")
async def list_credit_cards(u: dict = Depends(get_current_user)):
    db = get_db()
    cards_cursor = db.credit_cards.find({"user_id": u["id"]})
    # Also support old 'userId' for backward compatibility
    if await db.credit_cards.count_documents({"user_id": u["id"]}) == 0:
        cards_cursor = db.credit_cards.find({"userId": u["id"]})
        
    cards = await cards_cursor.to_list(100)
    result = []
    
    for card in cards:
        # Calculate currentUsage dynamically from expenses for THIS card
        pipeline = [
            {"$match": {
                "user_id": u["id"], 
                "paymentMethod": "Credit Card",
                "creditCardId": str(card["_id"])
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        res = await db.expenses.aggregate(pipeline).to_list(1)
        current_usage = float(res[0]["total"]) if res else 0.0
        
        result.append({
            "id": str(card["_id"]),
            "cardName": card.get("cardName", ""),
            "bankName": card.get("bankName", ""),
            "creditLimit": float(card.get("creditLimit", 0.0)),
            "currentUsage": round(current_usage, 2),
            "billingDate": int(card.get("billingDate", 1)),
            "dueDate": int(card.get("dueDate", 1)),
            "outstanding": float(card.get("outstanding", 0.0)),
            "availableLimit": float(card.get("availableLimit", 0.0)),
            "minimumDue": float(card.get("minimumDue", 0.0)),
            "statementDate": card.get("statementDate", ""),
            "lastImported": card.get("lastImported", ""),
            "createdAt": card.get("createdAt").isoformat() if hasattr(card.get("createdAt"), "isoformat") else str(card.get("createdAt"))
        })
        
    return result

@router.post("")
async def upsert_credit_card(
    card_data: CreditCardCreate = Body(...),
    u: dict = Depends(get_current_user)
):
    db = get_db()
    now = datetime.now(timezone.utc)
    
    doc = {
        "user_id": u["id"],
        "cardName": card_data.cardName,
        "bankName": card_data.bankName,
        "creditLimit": card_data.creditLimit,
        "billingDate": card_data.billingDate,
        "dueDate": card_data.dueDate,
        "outstanding": card_data.outstanding or 0,
        "availableLimit": card_data.availableLimit or card_data.creditLimit,
        "minimumDue": card_data.minimumDue or 0,
        "statementDate": card_data.statementDate,
        "lastImported": card_data.lastImported,
        "updatedAt": now
    }
    
    # Upsert based on user_id AND cardName
    await db.credit_cards.update_one(
        {"user_id": u["id"], "cardName": card_data.cardName},
        {"$set": doc, "$setOnInsert": {"createdAt": now}},
        upsert=True
    )
    
    card = await db.credit_cards.find_one({"user_id": u["id"], "cardName": card_data.cardName})
    if not card:
        raise HTTPException(status_code=500, detail="Failed to retrieve credit card after save.")
    
    pipeline = [
        {"$match": {"user_id": u["id"], "paymentMethod": "Credit Card", "creditCardId": str(card["_id"])}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    res_agg = await db.expenses.aggregate(pipeline).to_list(1)
    current_usage = float(res_agg[0]["total"]) if res_agg else 0.0
    
    return {
        "id": str(card["_id"]),
        "cardName": card.get("cardName", ""),
        "bankName": card.get("bankName", ""),
        "creditLimit": float(card.get("creditLimit", 0.0)),
        "currentUsage": round(current_usage, 2),
        "billingDate": int(card.get("billingDate", 1)),
        "dueDate": int(card.get("dueDate", 1)),
        "outstanding": float(card.get("outstanding", 0.0)),
        "availableLimit": float(card.get("availableLimit", 0.0)),
        "minimumDue": float(card.get("minimumDue", 0.0)),
        "statementDate": card.get("statementDate", ""),
        "lastImported": card.get("lastImported", ""),
        "createdAt": card.get("createdAt").isoformat() if hasattr(card.get("createdAt"), "isoformat") else str(card.get("createdAt"))
    }
