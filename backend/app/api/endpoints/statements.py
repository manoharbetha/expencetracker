from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body

from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.schemas import ExpenseCreate, MessageResponse
from app.services.pdf_extractor import extract_transactions_from_pdf
from app.services.ai_categorization import categorize_transactions_ai, summarize_import_ai
from app.services.fcm_service import send_to_user

router = APIRouter()

@router.post("/upload")
async def upload_statement(
    file: UploadFile = File(...),
    u: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
        
    # Extract
    extraction_result = await extract_transactions_from_pdf(content)
    raw_txns = extraction_result.get("items", [])
    
    # Filter out credits (income) for expense tracking
    expense_txns = [t for t in raw_txns if not t.get("is_credit", False)]
    
    if not expense_txns:
        return {
            "items": [], 
            "message": "No expense transactions found.",
            "debug": {
                "Root Cause": "Parser pattern mismatch & AI Fallback failure",
                "File Upload Status": f"Success: {file.filename} ({len(content)} bytes, {file.content_type})",
                "PDF Read Status": f"Success: {extraction_result.get('pages_read', 0)} pages read, {extraction_result.get('text_length', 0)} text length",
                "Source Detection Status": f"Detected: {extraction_result.get('source')}",
                "Parser Status": "Executed but yielded 0 results",
                "Transactions Extracted": 0,
                "Filtering Status": f"Before: {len(raw_txns)}, After: 0",
                "Groq Status": "Failed or returned empty",
                "Frontend Status": "Received empty items list"
            }
        }
        
    # Categorize via AI
    merchants = list(set([t["merchant"] for t in expense_txns]))
    category_mapping = await categorize_transactions_ai(merchants)
    
    # Apply categories
    for t in expense_txns:
        t["category"] = category_mapping.get(t["merchant"], "Other")
        
    return {
        "items": expense_txns,
        "message": f"Extracted {len(expense_txns)} transactions.",
        "debug": {
            "source_detected": extraction_result.get("source"),
            "fallback_used": extraction_result.get("fallback_used")
        }
    }

@router.post("/confirm")
async def confirm_statement(
    payload: List[dict] = Body(...),
    u: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    if not payload:
        raise HTTPException(status_code=400, detail="No transactions to import.")
        
    db = get_db()
    inserted_count = 0
    now = datetime.now(timezone.utc)
    
    # Optional: fetch recent expenses to prevent basic duplicates
    # A robust duplicate check would compare date, amount, merchant
    recent_docs = await db.expenses.find({"user_id": u["id"]}).sort("date", -1).limit(200).to_list(200)
    existing_hashes = set()
    for d in recent_docs:
        # Create a simple hash: date + merchant + amount
        h = f"{d.get('date')}_{d.get('merchant')}_{d.get('amount')}"
        existing_hashes.add(h)
        
    docs_to_insert = []
    for txn in payload:
        h = f"{txn.get('date')}_{txn.get('merchant')}_{txn.get('amount')}"
        if h in existing_hashes:
            continue # skip duplicate
            
        docs_to_insert.append({
            "user_id": u["id"],
            "amount": float(txn.get("amount", 0)),
            "category": txn.get("category", "Other"),
            "paymentMethod": "Other",
            "date": txn.get("date"),
            "description": txn.get("description", ""),
            "merchant": txn.get("merchant", ""),
            "source": "statement_import",
            "createdAt": now,
            "updatedAt": now
        })
        existing_hashes.add(h) # prevent duplicates within the payload itself
        
    if docs_to_insert:
        await db.expenses.insert_many(docs_to_insert)
        inserted_count = len(docs_to_insert)
        
    # Generate summary
    summary = await summarize_import_ai(docs_to_insert)
    
    if inserted_count > 0:
        await send_to_user(u["id"], "Statement Imported", f"{inserted_count} transactions imported successfully.", "statement")
    
    return {
        "message": f"{inserted_count} transactions imported successfully.",
        "summary": summary
    }
