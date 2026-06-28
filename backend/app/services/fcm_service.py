import logging
from datetime import datetime, timezone, timedelta, date
from bson import ObjectId
from app.db.mongodb import get_db

logger = logging.getLogger("expencetracker")

def classify_notification(title: str, message: str, notif_type: str) -> tuple[str | None, str | None]:
    """
    Returns (priority, category) or (None, None) if it is Low priority (should be silent/not saved).
    Categories: Finance, Credit Card, Budget, Goals, AI Insights, System
    Priorities: Critical, High, Medium, Low
    """
    t_upper = title.upper()
    m_upper = message.upper()
    nt_upper = notif_type.upper()
    
    # 1. Low Priority (Silent / Do NOT notify / return None)
    # Expense added, credit card added, credit card updated, profile updated
    if "EXPENSE ADDED" in t_upper or "EXPENSE_ADDED" in nt_upper or t_upper == "EXPENSE ADDED":
        return None, None
    if "NEW CREDIT CARD ADDED" in t_upper or "CREDIT CARD ADDED" in t_upper or "CARD_ADDED" in nt_upper:
        return None, None
    if "CREDIT CARD UPDATED" in t_upper or "CARD_UPDATED" in nt_upper:
        return None, None
    if "PROFILE UPDATED" in t_upper or "USER_UPDATED" in nt_upper or "PROFILE_UPDATED" in nt_upper:
        return None, None
    if nt_upper == "EXPENSE" and "ADDED" in t_upper:
        return None, None
        
    # 2. Critical
    if "PAYMENT DUE TODAY" in t_upper or "DUE TODAY" in m_upper or "DUE TODAY" in t_upper:
        is_cc = "CREDIT" in t_upper or "CREDIT" in m_upper or nt_upper == "CREDIT_CARD"
        return "Critical", "Credit Card" if is_cc else "Finance"
    if "UTILIZATION" in t_upper and "90%" in m_upper:
        return "Critical", "Credit Card"
    if "BUDGET EXCEEDED" in t_upper or t_upper == "BUDGET EXCEEDED":
        return "Critical", "Budget"
        
    # 3. High
    if "PAYMENT DUE IN 3 DAYS" in t_upper or "DUE IN 3 DAYS" in m_upper or "DUE IN 3 DAYS" in t_upper or "DUE WITHIN 3 DAYS" in t_upper or "DUE WITHIN 3 DAYS" in m_upper:
        is_cc = "CREDIT" in t_upper or "CREDIT" in m_upper or nt_upper == "CREDIT_CARD"
        return "High", "Credit Card" if is_cc else "Finance"
    if "UTILIZATION" in t_upper and "80%" in m_upper:
        return "High", "Credit Card"
    if "GOAL COMPLETED" in t_upper or "GOAL ACHIEVED" in t_upper or t_upper == "GOAL ACHIEVED" or "ACHIEVED YOUR GOAL" in m_upper:
        return "High", "Goals"
    if "STATEMENT IMPORT FAILED" in t_upper or "STATEMENT IMPORTED FAILED" in t_upper or "STATEMENT IMPORT FAILURE" in t_upper:
        return "High", "Finance"
        
    # 4. Medium
    if "BUDGET ALERT" in t_upper or "BUDGET SUGGESTION" in t_upper or "BUDGET ALERT (90%)" in t_upper or ("90%" in m_upper and "BUDGET" in t_upper):
        return "Medium", "Budget"
    if "UTILIZATION" in t_upper and "30%" in m_upper:
        return "Medium", "Credit Card"
    if "PAYMENT DUE IN 7 DAYS" in t_upper or "DUE IN 7 DAYS" in m_upper or "DUE IN 7 DAYS" in t_upper or "DUE WITHIN 7 DAYS" in t_upper or "DUE WITHIN 7 DAYS" in m_upper:
        is_cc = "CREDIT" in t_upper or "CREDIT" in m_upper or nt_upper == "CREDIT_CARD"
        return "Medium", "Credit Card" if is_cc else "Finance"
    if "GOAL PROGRESS" in t_upper or "GOAL Progress" in t_upper or "90% COMPLETED" in m_upper or "90% completed" in m_upper or ("90%" in t_upper and "GOAL" in t_upper):
        return "Medium", "Goals"
    if "STATEMENT IMPORTED" in t_upper or "STATEMENT SUCCESS" in t_upper or "STATEMENT IMPORTED SUCCESSFULLY" in t_upper:
        return "Medium", "Finance"
    if "AI STATEMENT PARSING FAILED" in t_upper or "AI STATEMENT PARSING FAILURE" in t_upper or "AI PARSER FAILED" in t_upper:
        return "Medium", "AI Insights"
    if nt_upper == "AI" or nt_upper == "AI_INSIGHTS":
        return "Medium", "AI Insights"
        
    # Default fallbacks
    if nt_upper == "BUDGET":
        return "Medium", "Budget"
    if nt_upper == "CREDIT_CARD" or nt_upper == "CREDITCARD":
        return "Medium", "Credit Card"
    if nt_upper == "GOAL":
        return "Medium", "Goals"
    if nt_upper == "SYSTEM":
        return "High", "System"
        
    return "Medium", "Finance"

async def send_to_user(
    user_id: str, 
    title: str, 
    message: str, 
    notif_type: str, 
    threshold: str = None, 
    credit_card_id: str = None, 
    goal_id: str = None,
    due_date: str = None
) -> dict | None:
    db = get_db()
    
    # Classify notification priority and category
    priority, category = classify_notification(title, message, notif_type)
    if not priority:
        # Low priority, remains silent
        return None
        
    # Duplicate prevention using notifications collection
    query = {
        "userId": user_id,
        "type": notif_type,
        "isRead": False
    }
    if threshold:
        query["threshold"] = threshold
    if credit_card_id:
        query["creditCardId"] = credit_card_id
    if goal_id:
        query["goalId"] = goal_id
    if due_date:
        query["dueDate"] = due_date
        
    # Special duplicate check for statements (within last 5 minutes)
    if notif_type == "statement":
        five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
        query["createdAt"] = {"$gte": five_minutes_ago}
        query.pop("isRead", None) # check regardless of read state
        
    existing = await db.notifications.find_one(query)
    if existing:
        logger.info(f"Duplicate notification blocked: {title} - {message}")
        return None
        
    # Save to notifications collection
    new_notif = {
        "userId": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "category": category,
        "priority": priority,
        "isRead": False,
        "createdAt": datetime.now(timezone.utc)
    }
    if threshold:
        new_notif["threshold"] = threshold
    if credit_card_id:
        new_notif["creditCardId"] = credit_card_id
    if goal_id:
        new_notif["goalId"] = goal_id
    if due_date:
        new_notif["dueDate"] = due_date
        
    await db.notifications.insert_one(new_notif)
    new_notif["id"] = str(new_notif["_id"])
    logger.info(f"In-app notification saved | User: {user_id} | Title: {title} | Priority: {priority}")
    return new_notif

async def check_budget_notifications(user_id: str, db):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        user = await db.users.find_one({"id": user_id})
    if not user:
        return
        
    monthly_income = float(user.get("monthlyIncome", 0.0))
    if monthly_income <= 0:
        return
        
    today = date.today()
    start_of_month = today.replace(day=1).isoformat()
    
    expenses = await db.expenses.find({"user_id": user_id, "date": {"$gte": start_of_month}}).to_list(1000)
    total_spent = sum([float(e.get("amount", 0)) for e in expenses])
    
    threshold = "0"
    if total_spent >= monthly_income:
        threshold = "100"
    elif total_spent >= monthly_income * 0.9:
        threshold = "90"
        
    # Clean up notifications for other/previous thresholds that are no longer valid
    if threshold == "100":
        await db.notifications.delete_many({"userId": user_id, "type": "budget", "threshold": "90", "isRead": False})
    elif threshold == "90":
        await db.notifications.delete_many({"userId": user_id, "type": "budget", "threshold": "100", "isRead": False})
    elif threshold == "0":
        await db.notifications.delete_many({"userId": user_id, "type": "budget", "threshold": {"$in": ["90", "100"]}, "isRead": False})
        
    if threshold != "0":
        if threshold == "100":
            title = "Budget Exceeded"
            msg = f"You have exceeded your monthly budget of ₹{monthly_income:.2f} (spent: ₹{total_spent:.2f})."
        else:
            pct = int((total_spent / monthly_income) * 100)
            title = "Budget Alert (90%)"
            msg = f"You have utilized {pct}% of your monthly income (₹{total_spent:.2f} of ₹{monthly_income:.2f})."
            
        await send_to_user(user_id, title, msg, "budget", threshold=threshold)

async def check_credit_card_utilization_notifications(user_id: str, db):
    cards = await db.credit_cards.find({"$or": [{"user_id": user_id}, {"userId": user_id}]}).to_list(100)
    for card in cards:
        card_id = str(card["_id"])
        card_name = card.get("cardName", "Credit Card")
        limit = float(card.get("creditLimit", 0.0))
        if limit <= 0:
            continue
            
        pipeline = [
            {"$match": {
                "user_id": user_id,
                "paymentMethod": "Credit Card",
                "creditCardId": card_id
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        res = await db.expenses.aggregate(pipeline).to_list(1)
        current_usage = float(res[0]["total"]) if res else 0.0
        
        utilization = (current_usage / limit) * 100
        
        threshold = "0"
        if utilization >= 90:
            threshold = "90"
        elif utilization >= 80:
            threshold = "80"
        elif utilization >= 30:
            threshold = "30"
            
        # Clean up other unread utilization notifications for this specific card
        if threshold == "90":
            await db.notifications.delete_many({"userId": user_id, "type": "credit_card", "creditCardId": card_id, "threshold": {"$in": ["30", "80"]}, "isRead": False})
        elif threshold == "80":
            await db.notifications.delete_many({"userId": user_id, "type": "credit_card", "creditCardId": card_id, "threshold": {"$in": ["30", "90"]}, "isRead": False})
        elif threshold == "30":
            await db.notifications.delete_many({"userId": user_id, "type": "credit_card", "creditCardId": card_id, "threshold": {"$in": ["80", "90"]}, "isRead": False})
        elif threshold == "0":
            await db.notifications.delete_many({"userId": user_id, "type": "credit_card", "creditCardId": card_id, "threshold": {"$in": ["30", "80", "90"]}, "isRead": False})
            
        if threshold != "0":
            if threshold == "90":
                title = "Credit Utilization Critical"
                msg = f"Credit utilization for '{card_name}' is above 90% ({utilization:.1f}%)."
            elif threshold == "80":
                title = "Credit Utilization High"
                msg = f"Credit utilization for '{card_name}' exceeds 80% ({utilization:.1f}%)."
            else:
                title = "Credit Utilization Warning"
                msg = f"Credit utilization for '{card_name}' exceeds 30% ({utilization:.1f}%)."
                
            await send_to_user(user_id, title, msg, "credit_card", threshold=threshold, credit_card_id=card_id)

async def check_goal_notifications(user_id: str, goal_id: str, db):
    goal = await db.goals.find_one({"_id": ObjectId(goal_id)})
    if not goal:
        return
        
    target = float(goal.get("targetAmount", 0.0))
    saved = float(goal.get("savedAmount", 0.0))
    if target <= 0:
        return
        
    pct = (saved / target) * 100
    goal_name = goal.get("goalName", goal.get("name", "Goal"))
    
    threshold = "0"
    if saved >= target:
        threshold = "100"
    elif pct >= 90:
        threshold = "90"
        
    # Clean up other unread progress notifications for this specific goal
    if threshold == "100":
        await db.notifications.delete_many({"userId": user_id, "type": "goal", "goalId": goal_id, "threshold": "90", "isRead": False})
    elif threshold == "90":
        await db.notifications.delete_many({"userId": user_id, "type": "goal", "goalId": goal_id, "threshold": "100", "isRead": False})
    elif threshold == "0":
        await db.notifications.delete_many({"userId": user_id, "type": "goal", "goalId": goal_id, "threshold": {"$in": ["90", "100"]}, "isRead": False})
        
    if threshold != "0":
        if threshold == "100":
            title = "Goal Achieved"
            msg = f"Congratulations! You achieved your goal '{goal_name}'!"
        else:
            title = "Goal Progress Alert"
            msg = f"Your goal '{goal_name}' is 90% completed (saved ₹{saved:.2f} of ₹{target:.2f})."
            
        await send_to_user(user_id, title, msg, "goal", threshold=threshold, goal_id=goal_id)

