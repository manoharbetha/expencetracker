from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.services.ai_financial_coach import invalidate_insights_cache

router = APIRouter()

@router.delete("/clear-data")
async def clear_user_data(u: dict = Depends(get_current_user)):
    db = get_db()
    uid = u["id"]
    
    # Delete authenticated user's data from all personal collections
    await db.expenses.delete_many({"user_id": uid})
    await db.goals.delete_many({"user_id": uid})
    await db.debts.delete_many({"user_id": uid})
    await db.credit_cards.delete_many({"user_id": uid})
    await db.credit_cards.delete_many({"userId": uid})
    await db.statement_history.delete_many({"user_id": uid})
    await db.chat_history.delete_many({"user_id": uid})
    await db.notifications.delete_many({"user_id": uid})
    await db.notepad.delete_many({"user_id": uid})
    
    # Clear cached AI insights
    invalidate_insights_cache(uid)
    
    return {"message": "All your financial data has been successfully removed."}
