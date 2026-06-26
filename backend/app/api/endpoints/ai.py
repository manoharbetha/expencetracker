from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Body, Depends, Request
from pymongo import ASCENDING

from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.db.crud import serialize_doc
from app.schemas import ChatRequest, PurchaseImpactRequest, AIResponse
from app.services import generate_ai_response, build_ai_context
from app.services.ai_financial_coach import generate_dashboard_insights
from app.core.rate_limiter import limiter, user_or_ip_limit_key

router = APIRouter()

@router.get("/dashboard-insights")
async def get_dashboard_insights(u: dict = Depends(get_current_user)) -> dict:
    return await generate_dashboard_insights(get_db(), u["id"], u, force_refresh=False)

@router.post("/dashboard-insights/refresh")
async def refresh_dashboard_insights(u: dict = Depends(get_current_user)) -> dict:
    return await generate_dashboard_insights(get_db(), u["id"], u, force_refresh=True)

@router.post("/budget-suggestions", response_model=AIResponse)
@limiter.limit("20/minute", key_func=user_or_ip_limit_key)
async def budget_suggestions(request: Request, u: dict = Depends(get_current_user)) -> AIResponse:
    ctx = await build_ai_context(get_db(), u["id"], u)
    result = await generate_ai_response(
        f"{ctx}\n\nTask: Analyze this user's ACTUAL spending data and give 5 highly specific, "
        "numbered budget recommendations. Reference their actual categories and amounts. "
        "Do NOT give generic advice. Be concise and actionable."
    )
    return AIResponse(result=result)

@router.post("/chat", response_model=AIResponse)
@limiter.limit("20/minute", key_func=user_or_ip_limit_key)
async def ai_chat(
    request: Request,
    chat_data: ChatRequest = Body(...),
    u: dict = Depends(get_current_user),
) -> AIResponse:
    ctx = await build_ai_context(get_db(), u["id"], u)
    result = await generate_ai_response(
        f"{ctx}\n\nUser question: {chat_data.message}\n\n"
        "Answer concisely and specifically based on the user's actual financial data above."
    )
    now = datetime.now(timezone.utc)
    await get_db().chat_history.insert_many([
        {"user_id": u["id"], "role": "user", "message": chat_data.message, "createdAt": now},
        {"user_id": u["id"], "role": "assistant", "message": result, "createdAt": now},
    ])
    return AIResponse(result=result)

@router.get("/chat/history")
async def chat_history(u: dict = Depends(get_current_user)) -> List[dict]:
    cursor = get_db().chat_history.find({"user_id": u["id"]}).sort("createdAt", ASCENDING).limit(100)
    return [serialize_doc(d) async for d in cursor]

@router.post("/purchase-impact", response_model=AIResponse)
@limiter.limit("20/minute", key_func=user_or_ip_limit_key)
async def purchase_impact(
    request: Request,
    req_data: PurchaseImpactRequest = Body(...),
    u: dict = Depends(get_current_user),
) -> AIResponse:
    ctx = await build_ai_context(get_db(), u["id"], u)
    result = await generate_ai_response(
        f"{ctx}\n\nTask: Analyze the financial impact of buying '{req_data.item}' "
        f"for ₹{req_data.price:,.0f}. Consider: how many months of savings it represents, "
        "which goals it delays, EMI capacity remaining, and monthly cash flow. "
        "Give a clear BUY / WAIT / AVOID recommendation with reasoning."
    )
    return AIResponse(result=result)

@router.post("/goal-conflicts", response_model=AIResponse)
@limiter.limit("20/minute", key_func=user_or_ip_limit_key)
async def goal_conflicts(request: Request, u: dict = Depends(get_current_user)) -> AIResponse:
    ctx = await build_ai_context(get_db(), u["id"], u)
    result = await generate_ai_response(
        f"{ctx}\n\nTask: Analyze ALL financial goals for conflicts and feasibility. "
        "Check if EMI + goal contributions exceed income. Rank goals by priority. "
        "Flag which goals may be at risk. Suggest specific monthly allocation amounts per goal."
    )
    return AIResponse(result=result)

@router.post("/storytelling", response_model=AIResponse)
@limiter.limit("20/minute", key_func=user_or_ip_limit_key)
async def storytelling(request: Request, u: dict = Depends(get_current_user)) -> AIResponse:
    ctx = await build_ai_context(get_db(), u["id"], u)
    result = await generate_ai_response(
        f"{ctx}\n\nTask: Write a friendly, engaging 150-word financial story about this user's month. "
        "Reference their actual spending categories. Highlight specific wins, specific areas to improve, "
        "and end with a motivational nudge. Be warm, not robotic."
    )
    return AIResponse(result=result)

@router.post("/debt-alert", response_model=AIResponse)
@limiter.limit("20/minute", key_func=user_or_ip_limit_key)
async def debt_alert(request: Request, u: dict = Depends(get_current_user)) -> AIResponse:
    ctx = await build_ai_context(get_db(), u["id"], u)
    result = await generate_ai_response(
        f"{ctx}\n\nTask: Analyze upcoming EMIs and the user's active debts specifically. "
        "Which debts have the highest interest cost? How does total EMI compare to income? "
        "Give specific alerts for THIS month and recommend which debt to prioritize paying down first, with reasoning."
    )
    return AIResponse(result=result)
