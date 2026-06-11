from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
from pymongo import DESCENDING, ASCENDING
import io
import csv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.db.crud import list_docs, serialize_doc
from app.api.endpoints.goals import enrich_goal

router = APIRouter()

@router.get("")
@router.get("/dashboard") # Map both /analytics and /dashboard if prefixed with /analytics
async def dashboard(u: dict = Depends(get_current_user)) -> dict:
    db = get_db()
    uid = u["id"]

    exp_agg = await db.expenses.aggregate([
        {"$match": {"user_id": uid}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(1)
    total_expenses = float(exp_agg[0]["total"]) if exp_agg else 0.0
    monthly_income = float(u.get("monthlyIncome", 0))

    cat_agg = await db.expenses.aggregate([
        {"$match": {"user_id": uid}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$project": {"_id": 0, "category": "$_id", "total": {"$round": ["$total", 2]}}},
        {"$sort": {"total": -1}},
    ]).to_list(20)

    monthly_agg = await db.expenses.aggregate([
        {"$match": {"user_id": uid}},
        {"$addFields": {"dateObj": {"$toDate": "$date"}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": "$dateObj"}},
            "total": {"$sum": "$amount"},
        }},
        {"$project": {"_id": 0, "month": "$_id", "total": {"$round": ["$total", 2]}}},
        {"$sort": {"month": 1}},
    ]).to_list(24)

    active_goals = await db.goals.count_documents({"user_id": uid})
    active_debts = await db.debts.count_documents({"user_id": uid})

    total_emi_agg = await db.debts.aggregate([
        {"$match": {"user_id": uid}},
        {"$project": {
            "emi_value": {
                "$cond": [{"$eq": ["$type", "lent"]}, {"$multiply": ["$emi", -1]}, "$emi"]
            }
        }},
        {"$group": {"_id": None, "total": {"$sum": "$emi_value"}}},
    ]).to_list(1)
    total_emi = float(total_emi_agg[0]["total"]) if total_emi_agg else 0.0

    goals_list = await db.goals.find({"user_id": uid}).to_list(50)
    total_saved = sum(float(g.get("savedAmount", 0)) for g in goals_list)

    recent_expenses_cursor = db.expenses.find({"user_id": uid}).sort("date", DESCENDING).limit(5)
    recent_expenses = [serialize_doc(d) async for d in recent_expenses_cursor]

    return {
        "monthlyIncome": monthly_income,
        "totalExpenses": round(total_expenses, 2),
        "totalSavings": round(max(monthly_income - total_expenses, 0), 2),
        "totalGoalsSaved": round(total_saved, 2),
        "totalEmi": round(total_emi, 2),
        "activeGoals": active_goals,
        "activeDebts": active_debts,
        "categoryBreakdown": cat_agg,
        "monthlySpendingTrends": monthly_agg,
        "recentExpenses": recent_expenses,
    }

@router.get("/reports/monthly")
async def monthly_report(u: dict = Depends(get_current_user)) -> dict:
    db = get_db()
    uid = u["id"]

    trends = await db.expenses.aggregate([
        {"$match": {"user_id": uid}},
        {"$addFields": {"dateObj": {"$toDate": "$date"}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": "$dateObj"}},
            "total": {"$sum": "$amount"},
        }},
        {"$project": {"_id": 0, "month": "$_id", "total": {"$round": ["$total", 2]}}},
        {"$sort": {"month": -1}},
    ]).to_list(12)

    expense_sum = round(sum(t["total"] for t in trends), 2)
    income = float(u.get("monthlyIncome", 0))
    months = max(len(trends), 1)

    goals = await db.goals.find({"user_id": uid}).to_list(50)
    goal_summary = [enrich_goal(serialize_doc(g)) for g in goals]
    debts = await list_docs(db.debts, uid, sort_field="dueDate", sort_dir=ASCENDING)

    return {
        "period": "monthly",
        "expenseSummary": expense_sum,
        "savingsSummary": round((income * months) - expense_sum, 2),
        "spendingTrends": trends,
        "goalSummary": goal_summary,
        "debtSummary": debts,
    }

@router.get("/reports/yearly")
async def yearly_report(u: dict = Depends(get_current_user)) -> dict:
    db = get_db()
    uid = u["id"]

    trends = await db.expenses.aggregate([
        {"$match": {"user_id": uid}},
        {"$addFields": {"dateObj": {"$toDate": "$date"}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": "$dateObj"}},
            "total": {"$sum": "$amount"},
        }},
        {"$project": {"_id": 0, "month": "$_id", "total": {"$round": ["$total", 2]}}},
        {"$sort": {"month": 1}},
    ]).to_list(24)

    expense_sum = round(sum(t["total"] for t in trends), 2)
    income = float(u.get("monthlyIncome", 0))
    months = max(len(trends), 1)

    return {
        "period": "yearly",
        "expenseSummary": expense_sum,
        "savingsSummary": round((income * months) - expense_sum, 2),
        "spendingTrends": trends,
    }

@router.get("/reports/export/csv")
async def export_csv(u: dict = Depends(get_current_user)):
    db = get_db()
    uid = u["id"]

    expenses = await db.expenses.find({"user_id": uid}).to_list(1000)
    goals = await db.goals.find({"user_id": uid}).to_list(100)
    debts = await db.debts.find({"user_id": uid}).to_list(100)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["--- EXPENSES ---"])
    writer.writerow(["Date", "Category", "Amount", "Description", "Payment Method"])
    for e in expenses:
        writer.writerow([e.get("date", ""), e.get("category", ""), e.get("amount", ""), e.get("description", ""), e.get("paymentMethod", "")])

    writer.writerow([])
    writer.writerow(["--- GOALS ---"])
    writer.writerow(["Goal Name", "Target Amount", "Saved Amount", "Deadline"])
    for g in goals:
        writer.writerow([g.get("goalName", ""), g.get("targetAmount", ""), g.get("savedAmount", ""), g.get("deadline", "")])

    writer.writerow([])
    writer.writerow(["--- DEBTS ---"])
    writer.writerow(["Title", "Type", "Amount", "EMI", "Interest Rate", "Due Date", "Lender"])
    for d in debts:
        writer.writerow([d.get("title", ""), d.get("type", "borrowed"), d.get("amount", ""), d.get("emi", ""), d.get("interestRate", ""), d.get("dueDate", ""), d.get("lender", "")])

    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=fintell_export.csv"})

@router.get("/reports/export/pdf")
async def export_pdf(u: dict = Depends(get_current_user)):
    db = get_db()
    uid = u["id"]

    expenses = await db.expenses.find({"user_id": uid}).to_list(1000)
    goals = await db.goals.find({"user_id": uid}).to_list(100)
    debts = await db.debts.find({"user_id": uid}).to_list(100)

    total_expense = sum(float(e.get("amount", 0)) for e in expenses)
    total_saved = sum(float(g.get("savedAmount", 0)) for g in goals)
    total_borrowed = sum(float(d.get("amount", 0)) for d in debts if d.get("type", "borrowed") == "borrowed")
    total_lent = sum(float(d.get("amount", 0)) for d in debts if d.get("type", "borrowed") == "lent")

    output = io.BytesIO()
    p = canvas.Canvas(output, pagesize=letter)
    
    p.setFont("Helvetica-Bold", 20)
    p.drawString(50, 750, f"FINTELL Financial Report: {u.get('name', 'User')}")
    
    p.setFont("Helvetica", 12)
    p.drawString(50, 710, f"Total Expenses Logged: INR {total_expense:,.2f}")
    p.drawString(50, 690, f"Total Goal Savings: INR {total_saved:,.2f}")
    p.drawString(50, 670, f"Total Debt (Borrowed): INR {total_borrowed:,.2f}")
    p.drawString(50, 650, f"Total Debt (Lent): INR {total_lent:,.2f}")

    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, 610, "Recent Expenses (Last 10)")
    
    p.setFont("Helvetica", 10)
    y = 590
    for e in sorted(expenses, key=lambda x: x.get("date", ""), reverse=True)[:10]:
        p.drawString(50, y, f"{e.get('date', '')} | {e.get('category', '')} | INR {e.get('amount', 0):,.2f} | {e.get('description', '')}")
        y -= 20
        if y < 50:
            p.showPage()
            y = 750

    p.save()
    output.seek(0)
    return StreamingResponse(output, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=fintell_report.pdf"})
