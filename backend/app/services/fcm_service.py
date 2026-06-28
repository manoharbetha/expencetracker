import logging
from datetime import datetime, timezone, timedelta
from app.db.mongodb import get_db

logger = logging.getLogger("expencetracker")

def classify_notification(title: str, message: str, notif_type: str) -> tuple[str, str]:
    """
    Returns (priority, category) or (None, None) if it is Low priority (should be silent).
    Categories: Finance, Credit Card, Budget, Goals, AI Insights, System
    Priorities: High, Medium, Low (Low is silent, return None)
    """
    t_upper = title.upper()
    m_upper = message.upper()
    nt_upper = notif_type.upper()
    
    # Low Priority (Silent)
    # Expense added, edited, deleted, preference changes, category/merchant, login/logout, viewing analytics, dashboard opened
    if "EXPENSE" in t_upper or nt_upper == "EXPENSE":
        return None, None
    if "VIEW" in t_upper or "ANALYTICS" in t_upper or "DASHBOARD" in t_upper:
        return None, None
    if "PREFERENCE" in t_upper or "CATEGORY" in t_upper or "MERCHANT" in t_upper:
        return None, None
    if "LOGIN" in t_upper or "LOGOUT" in t_upper or "SIGNIN" in t_upper or "SIGNOUT" in t_upper:
        return None, None
        
    # High Priority
    if "STATEMENT IMPORTED" in t_upper or ("STATEMENT" in t_upper and "SUCCESS" in t_upper):
        if "CREDIT CARD" in m_upper or "CREDIT_CARD" in nt_upper or "CREDIT CARD" in t_upper:
            return "High", "Credit Card"
        return "High", "Finance"
    if "STATEMENT IMPORT FAILED" in t_upper or ("STATEMENT" in t_upper and "FAILED" in t_upper):
        if "CREDIT CARD" in m_upper or "CREDIT_CARD" in nt_upper or "CREDIT CARD" in t_upper:
            return "High", "Credit Card"
        return "High", "Finance"
    if "BILL DUE" in t_upper or "PAYMENT DUE" in t_upper or ("DUE" in t_upper and "CREDIT" in t_upper) or "CREDIT CARD REMINDER" in t_upper:
        return "High", "Credit Card"
    if "BUDGET EXCEEDED" in t_upper or "BUDGET Alert" in t_upper or "BUDGET ALERT" in t_upper or "90%" in m_upper or ("UTILI" in t_upper and "BUDGET" in t_upper):
        return "High", "Budget"
    if "GOAL ACHIEVED" in t_upper or "GOAL COMPLETED" in t_upper or "ACHIEVED" in m_upper or "ACHIEVED" in t_upper:
        if "COMPLETED" in t_upper or "COMPLETED" in m_upper:
            return "Medium", "Goals"
        return "High", "Goals"
    if "UTILIZATION" in t_upper or "CC UTILIZATION" in t_upper or ("UTILIZATION" in m_upper and "CREDIT" in m_upper):
        return "High", "Credit Card"
    if "FAILED PAYMENT" in t_upper or "PAYMENT FAILED" in t_upper or "FAILED IMPORT" in t_upper or "IMPORT FAILED" in t_upper:
        return "High", "Finance"
    if "UNUSUAL SPENDING" in t_upper or "UNUSUAL" in m_upper or "ANOMALY" in t_upper:
        return "High", "AI Insights"
    if "CLEAR DATA" in t_upper or "DATA CLEARED" in t_upper or "CLEAR ALL DATA" in t_upper or "ALL DATA CLEARED" in t_upper:
        return "High", "System"
        
    # Medium Priority
    if "MONTH SUMMARY" in t_upper or "NEW MONTH" in t_upper or "MONTHLY SUMMARY" in t_upper:
        return "Medium", "Finance"
    if "LINKED" in t_upper or "LINK" in m_upper:
        return "Medium", "Credit Card"
    if "NEW CREDIT CARD" in t_upper or "NEW CARD" in t_upper or "CARD ADDED" in t_upper or "CARD CREATED" in t_upper or "CREDIT CARD ADDED" in t_upper:
        return "Medium", "Credit Card"
    if "CREDIT CARD DELETED" in t_upper or "CARD DELETED" in t_upper or "CARD REMOVED" in t_upper or "CREDIT CARD REMOVED" in t_upper:
        return "Medium", "Credit Card"
    if "GOAL COMPLETED" in t_upper or "GOAL DEADLINE" in t_upper or "GOAL" in t_upper:
        return "Medium", "Goals"
        
    # Fallback mappings
    if nt_upper == "AI" or nt_upper == "AI_INSIGHTS":
        return "High", "AI Insights"
    if nt_upper == "BUDGET":
        return "High", "Budget"
    if nt_upper == "CREDIT_CARD" or nt_upper == "CREDITCARD":
        return "Medium", "Credit Card"
    if nt_upper == "GOAL":
        return "Medium", "Goals"
    if nt_upper == "SYSTEM":
        return "High", "System"
        
    return "Medium", "Finance"

async def send_to_user(user_id: str, title: str, message: str, notif_type: str):
    db = get_db()
    
    # Classify notification priority and category
    priority, category = classify_notification(title, message, notif_type)
    if not priority:
        # Low priority, remains silent
        return
        
    # Prevent duplicate notifications for the same event within the last 5 minutes
    five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    dup = await db.notifications.find_one({
        "userId": user_id,
        "title": title,
        "message": message,
        "createdAt": {"$gte": five_minutes_ago}
    })
    if dup:
        logger.info(f"Duplicate notification blocked: {title} - {message}")
        return
        
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
    await db.notifications.insert_one(new_notif)
    logger.info(f"In-app notification saved | User: {user_id} | Title: {title} | Priority: {priority}")
