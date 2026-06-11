from typing import List
from fastapi import APIRouter, Body, Depends
from pymongo import ASCENDING

from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.db.crud import create_doc, list_docs, get_doc, update_doc, delete_doc
from app.schemas import GoalCreate, GoalUpdate, MessageResponse
from app.services import calculate_goal_metrics
from app.services.fcm_service import send_to_user

router = APIRouter()

def enrich_goal(g: dict) -> dict:
    metrics = calculate_goal_metrics(
        g.get("targetAmount", 0),
        g.get("savedAmount", 0),
        g.get("deadline", ""),
    )
    return {**g, **metrics}

@router.post("", status_code=201)
async def create_goal(
    goal_data: GoalCreate = Body(...),
    u: dict = Depends(get_current_user),
) -> dict:
    g = await create_doc(get_db().goals, u["id"], goal_data.model_dump())
    if g.get("name"):
        await send_to_user(u["id"], "Goal Created", f"{g['name']} Goal Added", "goal")
    return enrich_goal(g)

@router.get("")
async def get_goals(u: dict = Depends(get_current_user)) -> List[dict]:
    goals = await list_docs(get_db().goals, u["id"], sort_field="deadline", sort_dir=ASCENDING)
    return [enrich_goal(g) for g in goals]

@router.get("/{goal_id}")
async def get_goal_by_id(goal_id: str, u: dict = Depends(get_current_user)) -> dict:
    g = await get_doc(get_db().goals, u["id"], goal_id)
    return enrich_goal(g)

@router.put("/{goal_id}")
async def update_goal_by_id(
    goal_id: str,
    goal_data: GoalUpdate = Body(...),
    u: dict = Depends(get_current_user),
) -> dict:
    old_g = await get_doc(get_db().goals, u["id"], goal_id)
    g = await update_doc(get_db().goals, u["id"], goal_id, goal_data.model_dump())
    
    # Check if goal was just completed
    if g.get("savedAmount", 0) >= g.get("targetAmount", 0) and old_g.get("savedAmount", 0) < old_g.get("targetAmount", 0):
        await send_to_user(u["id"], "Goal Completed", "You achieved your goal", "goal")
        
    return enrich_goal(g)

@router.delete("/{goal_id}", response_model=MessageResponse)
async def delete_goal_by_id(goal_id: str, u: dict = Depends(get_current_user)) -> MessageResponse:
    await delete_doc(get_db().goals, u["id"], goal_id)
    return MessageResponse(message="Goal deleted successfully.")
