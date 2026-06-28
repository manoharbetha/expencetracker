from datetime import datetime, timezone, date, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging
from app.db.mongodb import get_db
from app.services.fcm_service import send_to_user
from groq import AsyncGroq
from app.core.config import get_settings

logger = logging.getLogger("expencetracker")

scheduler = AsyncIOScheduler()

async def generate_daily_ai_insight(user_id: str, db):
    try:
        # Check if user already got an AI insight in the last 24 hours
        one_day_ago = datetime.now(timezone.utc) - timedelta(days=1)
        last_ai_notif = await db.notifications.find_one(
            {"userId": user_id, "type": "ai"},
            sort=[("createdAt", -1)]
        )
        if last_ai_notif:
            created_at = last_ai_notif.get("createdAt")
            if created_at and created_at.replace(tzinfo=timezone.utc) > one_day_ago:
                logger.info(f"AI insight already sent for user {user_id} in the last 24h. Skipping.")
                return

        # Get recent data
        now = datetime.now(timezone.utc)
        start_date = (now - timedelta(days=7)).isoformat()
        
        expenses = await db.expenses.find({"user_id": user_id, "date": {"$gte": start_date}}).to_list(100)
        goals = await db.goals.find({"user_id": user_id}).to_list(10)
        
        expense_summary = sum([float(e.get("amount", 0)) for e in expenses])
        
        prompt = f"""
        Analyze the user's spending data and generate a short, intelligent financial notification (1-2 sentences).
        Examples of what you should generate:
        - Your credit utilization increased from 45% to 82% (if credit utilization changed significantly).
        - Dining expenses increased 30% compared to last month.
        - You are likely to exceed your entertainment budget this month.
        Keep it extremely concise, professional, and personalized to the user's actual spending data if provided.
        
        Total spent this week: {expense_summary}
        Number of active goals: {len(goals)}
        """
        
        s = get_settings()
        if not s.groq_api_key: return
        client = AsyncGroq(api_key=s.groq_api_key)
        
        completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a friendly AI financial assistant."},
                {"role": "user", "content": prompt}
            ],
            model=s.groq_model,
            temperature=0.7,
            max_tokens=100
        )
        insight = completion.choices[0].message.content.strip()
        
        # Check similarity with last insight to avoid duplicates
        if last_ai_notif and last_ai_notif.get("message") == insight:
            logger.info("AI insight matches last one. Blocking duplicate.")
            return
            
        await send_to_user(user_id, "🤖 Daily Financial Insight", insight, "ai")
    except Exception as e:
        logger.error(f"Failed to generate AI insight for {user_id}: {e}")

async def run_daily_jobs():
    logger.info("[Scheduler] Running daily jobs...")
    db = get_db()
    today = date.today()
    
    users = await db.users.find({}).to_list(1000)
    for u in users:
        uid = str(u["_id"])
        if "id" in u:
            uid = str(u["id"])
            
        # Daily AI Insight
        await generate_daily_ai_insight(uid, db)
        
    # Debts / EMI due date reminders (7 days, 3 days, today)
    debts = await db.debts.find({}).to_list(1000)
    for d in debts:
        uid = d["user_id"]
        title = d.get("title", "Debt")
        emi = d.get("emi", 0)
        due_date_str = d.get("dueDate")
        if not due_date_str:
            continue
        try:
            due_date = date.fromisoformat(due_date_str)
            days_left = (due_date - today).days
            
            if days_left in [0, 3, 7]:
                if days_left == 0:
                    t = "Payment Due Today"
                    msg = f"Your EMI payment of ₹{emi} for '{title}' is due today!"
                elif days_left == 3:
                    t = "Payment Due in 3 Days"
                    msg = f"Your EMI payment of ₹{emi} for '{title}' is due in 3 days."
                else:
                    t = "Payment Due in 7 Days"
                    msg = f"Your EMI payment of ₹{emi} for '{title}' is due in 7 days."
                    
                await send_to_user(uid, t, msg, "debt", due_date=due_date_str)
        except Exception as e:
            logger.error(f"Failed to check debt payment: {e}")
            
    # Credit Card bill reminders (7 days, 3 days, today)
    cards_cursor = db.credit_cards.find({})
    async for card in cards_cursor:
        uid = card.get("user_id", card.get("userId"))
        if not uid:
            continue
        card_id = str(card["_id"])
        card_name = card.get("cardName", "Credit Card")
        
        # 1. Fetch latest statement to get due_date
        latest_stmt = await db.statement_history.find_one(
            {"credit_card_id": card_id},
            sort=[("importedAt", -1)]
        )
        
        next_due = None
        due_date_str = ""
        
        if latest_stmt and latest_stmt.get("due_date"):
            due_date_str = latest_stmt["due_date"]
            try:
                next_due = date.fromisoformat(due_date_str)
            except Exception:
                pass
                
        if not next_due:
            # Fallback to card's default dueDate (day of month)
            due_day = int(card.get("dueDate", 1))
            try:
                due_this_month = today.replace(day=due_day)
            except ValueError:
                due_this_month = today.replace(day=28)
                
            if today.day <= due_day:
                next_due = due_this_month
            else:
                if today.month == 12:
                    next_due = date(today.year + 1, 1, due_day)
                else:
                    try:
                        next_due = date(today.year, today.month + 1, due_day)
                    except ValueError:
                        next_due = date(today.year, today.month + 1, 28)
            due_date_str = next_due.isoformat()
            
        days_left = (next_due - today).days
        if days_left in [0, 3, 7]:
            if days_left == 0:
                t = "Payment Due Today"
                msg = f"Your credit card payment for '{card_name}' is due today!"
            elif days_left == 3:
                t = "Payment Due in 3 Days"
                msg = f"Your credit card payment for '{card_name}' is due in 3 days."
            else:
                t = "Payment Due in 7 Days"
                msg = f"Your credit card payment for '{card_name}' is due in 7 days."
                
            await send_to_user(uid, t, msg, "credit_card", due_date=due_date_str, credit_card_id=card_id)

    # Auto-cleanup read notifications older than 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    await db.notifications.delete_many({
        "isRead": True,
        "createdAt": {"$lt": thirty_days_ago}
    })

def start_scheduler():
    # Run every day at 9:00 AM
    scheduler.add_job(run_daily_jobs, 'cron', hour=9, minute=0)
    scheduler.start()

def stop_scheduler():
    scheduler.shutdown()

