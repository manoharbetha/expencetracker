from typing import List, Dict, Any
from datetime import datetime, timezone
import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body, Request

from app.core.security import get_current_user
from app.db.mongodb import get_db
from app.schemas import ExpenseCreate, MessageResponse
from app.services.pdf_extractor import extract_transactions_from_pdf
from app.services.ai_categorization import categorize_transactions_ai, summarize_import_ai
from app.services.fcm_service import send_to_user
from app.core.config import get_settings
from app.core.rate_limiter import limiter, user_or_ip_limit_key

router = APIRouter()
logger = logging.getLogger("expencetracker")

@router.post("/upload")
@limiter.limit("10/minute", key_func=user_or_ip_limit_key)
async def upload_statement(
    request: Request,
    file: UploadFile = File(...),
    u: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are supported.")
        
    try:
        content = await file.read(10 * 1024 * 1024 + 1)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds the 10 MB limit.")
            
        if not content:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")
            
        if not content.startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="Invalid PDF file structure.")
    finally:
        await file.close()
        
    # Extract
    extraction_result = await extract_transactions_from_pdf(content)
    raw_txns = extraction_result.get("items", [])
    
    # Filter out credits (income) for expense tracking
    expense_txns = [t for t in raw_txns if not t.get("is_credit", False)]
    
    settings = get_settings()
    if not expense_txns:
        res = {
            "items": [], 
            "message": "No expense transactions found."
        }
        if settings.app_env.lower() != "production":
            res["debug"] = {
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
        return res
        
    # Categorize via AI
    merchants = list(set([t["merchant"] for t in expense_txns]))
    category_mapping = await categorize_transactions_ai(merchants)
    
    # Duplicate Detection
    db = get_db()
    recent_docs = await db.expenses.find({"user_id": u["id"]}).sort("date", -1).limit(1000).to_list(1000)
    existing_hashes = set()
    for d in recent_docs:
        h = f"{d.get('date')}_{d.get('merchant')}_{d.get('amount')}"
        existing_hashes.add(h)
        
    # Apply categories and check duplicates
    new_count = 0
    dup_count = 0
    for t in expense_txns:
        t["category"] = category_mapping.get(t["merchant"], "Other")
        t_hash = f"{t.get('date')}_{t.get('merchant')}_{t.get('amount')}"
        if t_hash in existing_hashes:
            t["status"] = "Duplicate"
            dup_count += 1
        else:
            t["status"] = "New"
            new_count += 1
            existing_hashes.add(t_hash) # prevent duplicates within the same PDF
        
    res = {
        "items": expense_txns,
        "message": f"Extracted {len(expense_txns)} transactions.",
        "statement_type": extraction_result.get("statement_type", "bank"),
        "cc_details": extraction_result.get("cc_details", {}),
        "summary": {
            "transactions_found": len(expense_txns),
            "new": new_count,
            "duplicate": dup_count
        }
    }
    if settings.app_env.lower() != "production":
        res["debug"] = {
            "source_detected": extraction_result.get("source"),
            "fallback_used": extraction_result.get("fallback_used")
        }
    return res

@router.post("/confirm")
@limiter.limit("10/minute", key_func=user_or_ip_limit_key)
async def confirm_statement(
    request: Request,
    payload: Dict[str, Any] = Body(...),
    u: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    transactions = payload.get("transactions", [])
    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions to import.")
        
    statement_type = payload.get("statement_type", "bank")
    cc_details = payload.get("cc_details", {})
    filename = payload.get("filename", "unknown.pdf")
    
    db = get_db()
    inserted_count = 0
    now = datetime.now(timezone.utc)
    
    # Update Credit Card if applicable
    cc_id = None
    if statement_type == "credit_card" and cc_details:
        card_name = cc_details.get("card_name", "Unknown Card")
        # Upsert logic based on card name
        existing_cc = await db.credit_cards.find_one({"user_id": u["id"], "cardName": card_name})
        
        cc_update_data = {
            "cardName": card_name,
            "bankName": cc_details.get("bank_name"),
            "creditLimit": float(cc_details.get("credit_limit") or existing_cc.get("creditLimit", 50000) if existing_cc else 50000),
            "outstanding": float(cc_details.get("outstanding") or 0),
            "availableLimit": float(cc_details.get("available_limit") or 0),
            "minimumDue": float(cc_details.get("minimum_due") or 0),
            "dueDate": int(cc_details.get("due_date") or existing_cc.get("dueDate", 5) if existing_cc else 5),
            "statementDate": cc_details.get("statement_date"),
            "lastImported": now.isoformat()
        }
        
        if existing_cc:
            await db.credit_cards.update_one({"_id": existing_cc["_id"]}, {"$set": cc_update_data})
            cc_id = str(existing_cc["_id"])
        else:
            cc_update_data["user_id"] = u["id"]
            cc_update_data["createdAt"] = now.isoformat()
            cc_update_data["billingDate"] = 15 # default
            res = await db.credit_cards.insert_one(cc_update_data)
            cc_id = str(res.inserted_id)

    # Prevent basic duplicates
    recent_docs = await db.expenses.find({"user_id": u["id"]}).sort("date", -1).limit(500).to_list(500)
    existing_hashes = set()
    for d in recent_docs:
        h = f"{d.get('date')}_{d.get('merchant')}_{d.get('amount')}"
        existing_hashes.add(h)
        
    docs_to_insert = []
    for txn in transactions:
        if txn.get("status") in ["Duplicate", "Skipped"]:
            continue
            
        h = f"{txn.get('date')}_{txn.get('merchant')}_{txn.get('amount')}"
        if h in existing_hashes:
            continue 
            
        docs_to_insert.append({
            "user_id": u["id"],
            "amount": float(txn.get("amount", 0)),
            "category": txn.get("category", "Other"),
            "paymentMethod": "Credit Card" if statement_type == "credit_card" else "Bank",
            "creditCardId": cc_id,
            "date": txn.get("date"),
            "description": txn.get("description", ""),
            "merchant": txn.get("merchant", ""),
            "source": "statement_import",
            "createdAt": now,
            "updatedAt": now
        })
        existing_hashes.add(h)
        
    if docs_to_insert:
        await db.expenses.insert_many(docs_to_insert)
        inserted_count = len(docs_to_insert)
        
    # Store import history
    await db.statement_history.insert_one({
        "user_id": u["id"],
        "filename": filename,
        "statementType": statement_type,
        "transactionsImported": inserted_count,
        "status": "Success",
        "importedAt": now.isoformat()
    })
    
    # Generate summary
    summary = await summarize_import_ai(docs_to_insert)
    
    if inserted_count > 0:
        await send_to_user(u["id"], "Statement Imported", f"{inserted_count} transactions imported via {statement_type}.", "statement")
    
    return {
        "message": f"{inserted_count} transactions imported successfully.",
        "summary": summary
    }
