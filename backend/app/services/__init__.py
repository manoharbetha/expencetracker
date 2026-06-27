from datetime import date
from math import ceil
from typing import Any, Dict
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import get_settings

logger = logging.getLogger("expencetracker")

def calculate_goal_metrics(target: float, saved: float, deadline_raw: Any) -> Dict[str, Any]:
    remaining = max(target - saved, 0.0)
    today = date.today()

    if isinstance(deadline_raw, str):
        try:
            dl = date.fromisoformat(deadline_raw[:10])
        except ValueError:
            dl = today
    elif isinstance(deadline_raw, date):
        dl = deadline_raw
    else:
        dl = today

    days_left = (dl - today).days
    months = max(1, ceil(days_left / 30))
    progress = min(100.0, (saved / target) * 100) if target > 0 else 0.0
    is_overdue = days_left < 0

    return {
        "progressPercentage": round(progress, 2),
        "remainingAmount": round(remaining, 2),
        "monthlySavingsNeeded": round(remaining / months, 2) if not is_overdue else 0.0,
        "daysLeft": max(0, days_left),
        "isOverdue": is_overdue,
        "isComplete": saved >= target,
    }

_FALLBACK = (
    "AI insights are currently unavailable. General advice: "
    "Track every rupee spent, maintain an emergency fund of 3-6 months' expenses, "
    "automate your SIPs and EMIs, and review your budget monthly."
)

async def generate_ai_response(prompt: str, groq_client = None) -> str:
    s = get_settings()
    if not s.groq_api_key:
        return _FALLBACK
    try:
        from groq import AsyncGroq
        client = groq_client or AsyncGroq(api_key=s.groq_api_key)
        
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are Expence Tracker, an expert financial advisor."},
                {"role": "user", "content": prompt}
            ],
            model=s.groq_model,
            temperature=0.7,
            max_tokens=1024,
        )
        return chat_completion.choices[0].message.content or _FALLBACK
    except Exception as exc:
        logger.error(f"Groq error occurred in generate_ai_response: {exc}")
        return _FALLBACK

async def build_ai_context(db: AsyncIOMotorDatabase, uid: str, user: dict) -> str:
    expenses = await db.expenses.find({"user_id": uid}).sort("date", -1).limit(30).to_list(30)
    goals = await db.goals.find({"user_id": uid}).to_list(20)
    debts = await db.debts.find({"user_id": uid}).to_list(20)
    cards = await db.credit_cards.find({"user_id": uid}).to_list(20)
    if not cards:
        cards = await db.credit_cards.find({"userId": uid}).to_list(20)

    # Clean expenses to send only necessary transaction information to AI
    cleaned_expenses = []
    for item in expenses:
        cleaned_expenses.append({
            "merchant": item.get("merchant", ""),
            "amount": float(item.get("amount", 0)),
            "category": item.get("category", "Other"),
            "date": item.get("date", ""),
            "paymentSource": item.get("paymentMethod", item.get("paymentSource", "Unknown"))
        })

    # Sanitize other collections to remove sensitive DB IDs or user IDs
    for item in goals:
        item.pop("_id", None)
        item.pop("user_id", None)
    for item in debts:
        item.pop("_id", None)
        item.pop("user_id", None)
    for item in cards:
        item.pop("_id", None)
        item.pop("user_id", None)
        item.pop("userId", None)

    income = user.get("monthlyIncome", 0)
    currency = user.get("currency", "INR")
    total_emi = sum(float(d.get("emi", 0)) for d in debts if d.get("type") != "lent")
    total_expense_30d = sum(float(e.get("amount", 0)) for e in expenses)
    total_saved_goals = sum(float(g.get("savedAmount", 0)) for g in goals)
    total_target_goals = sum(float(g.get("targetAmount", 0)) for g in goals)

    goal_details = [
        f"{g.get('goalName','Goal')}: saved {currency} {g.get('savedAmount',0):.0f} / {g.get('targetAmount',0):.0f}, deadline {g.get('deadline','?')}"
        for g in goals
    ]
    debt_details = [
        f"{d.get('title','Debt')} ({d.get('type', 'borrowed')}): {currency} {d.get('amount',0):.0f} @ {d.get('interestRate',0)}% interest, EMI {currency} {d.get('emi',0):.0f}, due {d.get('dueDate','?')}"
        for d in debts
    ]
    cc_details = [
        f"Card: {c.get('cardName', 'CC')} - Limit: {c.get('creditLimit', 0)}, Outstanding: {c.get('outstanding', 0)}, Due Date: Day {c.get('dueDate', 1)} of month."
        for c in cards
    ]

    return (
        "You are Expence Tracker, an empathetic, practical, India-focused personal finance AI. "
        "Always give specific, data-driven, non-generic advice. Reference actual numbers. "
        f"User profile: Monthly income = {currency} {income:,.0f}, Currency = {currency}. "
        f"Total EMI burden = {currency} {total_emi:,.0f}/month. "
        f"Spending last 30 days = {currency} {total_expense_30d:,.0f}. "
        f"Goals: {len(goals)} active, {currency} {total_saved_goals:,.0f} saved of {currency} {total_target_goals:,.0f} target. "
        f"Goal details: {'; '.join(goal_details) if goal_details else 'None'}. "
        f"Debt details: {'; '.join(debt_details) if debt_details else 'None'}. "
        f"Credit Cards: {'; '.join(cc_details) if cc_details else 'None'}. "
        f"Recent expenses (latest 30): {cleaned_expenses[:15]}. "
    )
