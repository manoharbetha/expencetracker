from datetime import datetime, timezone, date, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.db.mongodb import get_db
from app.services.fcm_service import send_to_user
from groq import AsyncGroq
from app.core.config import get_settings

scheduler = AsyncIOScheduler()

async def generate_daily_ai_insight(user_id: str, db):
    try:
        # Get recent data
        now = datetime.now(timezone.utc)
        start_date = (now - timedelta(days=7)).isoformat()
        
        expenses = await db.expenses.find({"user_id": user_id, "date": {"$gte": start_date}}).to_list(100)
        goals = await db.goals.find({"user_id": user_id}).to_list(10)
        
        expense_summary = sum([float(e.get("amount", 0)) for e in expenses])
        
        prompt = f"""
        Analyze this user's 7-day financial data and generate ONE short, personalized financial insight (max 2 sentences).
        Total spent this week: {expense_summary}
        Number of active goals: {len(goals)}
        Make it sound like a friendly AI assistant.
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
        await send_to_user(user_id, "🤖 Daily Financial Insight", insight, "ai")
    except Exception as e:
        print(f"Failed to generate AI insight for {user_id}: {e}")

async def check_budget_limit(user_id: str, monthly_income: float, db):
    if monthly_income <= 0: return
    
    today = date.today()
    start_of_month = today.replace(day=1).isoformat()
    
    expenses = await db.expenses.find({"user_id": user_id, "date": {"$gte": start_of_month}}).to_list(1000)
    total_spent = sum([float(e.get("amount", 0)) for e in expenses])
    
    if total_spent >= monthly_income * 0.9:
        pct = int((total_spent / monthly_income) * 100)
        await send_to_user(user_id, "Budget Alert", f"⚠ You have utilized {pct}% of your monthly income (₹{total_spent}).", "budget")

async def run_daily_jobs():
    print("[Scheduler] Running daily jobs...")
    db = get_db()
    today = date.today()
    
    # We need to iterate over all users to check budgets and generate AI insights
    users = await db.users.find({}).to_list(1000)
    
    for u in users:
        uid = str(u["_id"])
        if "id" in u:
            uid = str(u["id"])
            
        # Budget Check
        await check_budget_limit(uid, float(u.get("monthlyIncome", 0)), db)
        
        # AI Insight
        await generate_daily_ai_insight(uid, db)
        
    # EMI Reminders (due tomorrow)
    tomorrow = today + timedelta(days=1)
    debts = await db.debts.find({"dueDate": tomorrow.isoformat()}).to_list(1000)
    for d in debts:
        uid = d["user_id"]
        title = d.get("title", "Debt")
        emi = d.get("emi", 0)
        await send_to_user(uid, "EMI Reminder", f"Education/Loan EMI of ₹{emi} for '{title}' is due tomorrow.", "debt")
        
    # Goal Deadlines (due tomorrow)
    goals = await db.goals.find({"deadline": tomorrow.isoformat()}).to_list(1000)
    for g in goals:
        uid = g["user_id"]
        title = g.get("goalName", "Goal")
        await send_to_user(uid, "Goal Deadline", f"Your goal '{title}' is due tomorrow!", "goal")

def start_scheduler():
    # Run every day at 9:00 AM
    scheduler.add_job(run_daily_jobs, 'cron', hour=9, minute=0)
    scheduler.start()

def stop_scheduler():
    scheduler.shutdown()
