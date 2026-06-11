from typing import List
from fastapi import APIRouter, Body, Depends
from pymongo import ASCENDING

from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.db.crud import create_doc, list_docs, get_doc, update_doc, delete_doc
from app.schemas import DebtCreate, DebtUpdate, MessageResponse

router = APIRouter()

@router.post("", status_code=201)
async def create_debt(
    debt_data: DebtCreate = Body(...),
    u: dict = Depends(get_current_user),
) -> dict:
    return await create_doc(get_db().debts, u["id"], debt_data.model_dump())

@router.get("")
async def get_debts(u: dict = Depends(get_current_user)) -> List[dict]:
    return await list_docs(get_db().debts, u["id"], sort_field="dueDate", sort_dir=ASCENDING)

@router.get("/{debt_id}")
async def get_debt_by_id(debt_id: str, u: dict = Depends(get_current_user)) -> dict:
    return await get_doc(get_db().debts, u["id"], debt_id)

@router.put("/{debt_id}")
async def update_debt_by_id(
    debt_id: str,
    debt_data: DebtUpdate = Body(...),
    u: dict = Depends(get_current_user),
) -> dict:
    return await update_doc(get_db().debts, u["id"], debt_id, debt_data.model_dump())

@router.delete("/{debt_id}", response_model=MessageResponse)
async def delete_debt_by_id(debt_id: str, u: dict = Depends(get_current_user)) -> MessageResponse:
    await delete_doc(get_db().debts, u["id"], debt_id)
    return MessageResponse(message="Debt deleted successfully.")
