from datetime import datetime, timezone
from fastapi import APIRouter, Body, Depends, HTTPException
from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.schemas import CreditCardCreate
from app.services.ai_financial_coach import invalidate_insights_cache

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
        
        # Fetch the latest statement history for metadata
        latest_stmt = await db.statement_history.find_one(
            {"credit_card_id": str(card["_id"])},
            sort=[("importedAt", -1)]
        )
        
        outstanding = float(latest_stmt.get("outstanding_amount", 0.0)) if latest_stmt else 0.0
        credit_limit = float(card.get("creditLimit", 0.0))
        available_limit = credit_limit - current_usage
        
        result.append({
            "id": str(card["_id"]),
            "cardName": card.get("cardName", ""),
            "bankName": card.get("bankName", ""),
            "creditLimit": credit_limit,
            "currentUsage": round(current_usage, 2),
            "outstanding": round(outstanding, 2),
            "availableLimit": round(available_limit, 2),
            "minimumDue": float(latest_stmt.get("minimum_due", 0.0)) if latest_stmt else 0.0,
            "statementDate": latest_stmt.get("statement_date", "") if latest_stmt else "",
            "dueDate": str(latest_stmt.get("due_date", "")) if latest_stmt else "",
            "lastImported": latest_stmt.get("importedAt", "") if latest_stmt else "",
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
        "updatedAt": now
    }
    
    # Upsert based on user_id AND cardName
    await db.credit_cards.update_one(
        {"user_id": u["id"], "cardName": card_data.cardName},
        {"$set": doc, "$setOnInsert": {"createdAt": now}},
        upsert=True
    )
    invalidate_insights_cache(u["id"])
    
    card = await db.credit_cards.find_one({"user_id": u["id"], "cardName": card_data.cardName})
    if not card:
        raise HTTPException(status_code=500, detail="Failed to retrieve credit card after save.")
    
    return {
        "id": str(card["_id"]),
        "cardName": card.get("cardName", ""),
        "bankName": card.get("bankName", ""),
        "creditLimit": float(card.get("creditLimit", 0.0)),
        "createdAt": card.get("createdAt").isoformat() if hasattr(card.get("createdAt"), "isoformat") else str(card.get("createdAt"))
    }

@router.delete("")
async def delete_credit_card(u: dict = Depends(get_current_user)):
    db = get_db()
    await db.credit_cards.delete_many({"user_id": u["id"]})
    await db.credit_cards.delete_many({"userId": u["id"]})
    invalidate_insights_cache(u["id"])
    return {"message": "Credit card deleted successfully."}
