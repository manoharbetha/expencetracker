from typing import List, Dict, Any
from datetime import datetime, timezone
import logging
import asyncio
import io
import pdfplumber
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body, Request

from app.core.security import get_current_user, get_groq_client
from app.db.mongodb import get_db
from app.schemas import ExpenseCreate, MessageResponse
from app.services.pdf_extractor import extract_transactions_from_pdf, extract_cc_details_with_ai
from app.services.ai_categorization import categorize_transactions_ai, summarize_import_ai
from app.services.fcm_service import send_to_user
from app.services.ai_financial_coach import invalidate_insights_cache
from app.core.config import get_settings
from app.core.rate_limiter import limiter, user_or_ip_limit_key

router = APIRouter()
logger = logging.getLogger("expencetracker")

async def get_existing_hashes(user_id: str, db, limit: int = 1000) -> set:
    """Helper to retrieve deduplication hashes for a user's recent expenses."""
    recent_docs = await db.expenses.find({"user_id": user_id}).sort("date", -1).limit(limit).to_list(limit)
    existing_hashes = set()
    for d in recent_docs:
        h = f"{d.get('date')}_{d.get('merchant')}_{d.get('amount')}"
        existing_hashes.add(h)
    return existing_hashes

@router.post("/upload")
@limiter.limit("10/minute", key_func=user_or_ip_limit_key)
async def upload_statement(
    request: Request,
    file: UploadFile = File(...),
    u: dict = Depends(get_current_user),
    groq_client = Depends(get_groq_client)
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
            
        # Basic Preamble Check
        if not content.startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="Invalid PDF file structure.")
            
        # PDF Structural Validation using pdfplumber (Phase 2)
        try:
            with pdfplumber.open(io.BytesIO(content)) as test_pdf:
                _ = len(test_pdf.pages)
        except Exception as pe:
            raise HTTPException(status_code=400, detail=f"Malformed or corrupt PDF file structure: {str(pe)}")
            
    finally:
        await file.close()
        
    # Extract text and parse transactions using single open handle
    extraction_result = await extract_transactions_from_pdf(content, groq_client=groq_client)
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
        
    # Gather categories and credit card details in parallel
    merchants = list(set([t["merchant"] for t in expense_txns]))
    text_preview = extraction_result.get("text_preview", "")
    statement_type = extraction_result.get("statement_type", "bank")
    
    async def extract_cc_details_or_empty():
        if statement_type == "credit_card" and text_preview:
            return await extract_cc_details_with_ai(text_preview, groq_client=groq_client)
        return {}

    category_mapping, cc_details = await asyncio.gather(
        categorize_transactions_ai(merchants, groq_client=groq_client),
        extract_cc_details_or_empty()
    )
    
    # Duplicate Detection
    db = get_db()
    existing_hashes = await get_existing_hashes(u["id"], db, 1000)
        
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
        "statement_type": statement_type,
        "cc_details": cc_details,
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
    u: dict = Depends(get_current_user),
    groq_client = Depends(get_groq_client)
) -> Dict[str, Any]:
    transactions = payload.get("transactions", [])
    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions to import.")
        
    statement_type = payload.get("statement_type", "bank")
    cc_details = payload.get("cc_details", {})
    filename = payload.get("filename", "unknown.pdf")
    credit_card_id = payload.get("credit_card_id")
    conflict_resolution = payload.get("conflict_resolution")
    
    db = get_db()
    inserted_count = 0
    now = datetime.now(timezone.utc)
    
    cc_id = None
    statement_period = cc_details.get("statement_period")
    
    if statement_type == "credit_card":
        if not credit_card_id:
            raise HTTPException(status_code=400, detail="Credit card ID is required for credit card statements.")
            
        from bson import ObjectId
        try:
            cc = await db.credit_cards.find_one({"_id": ObjectId(credit_card_id), "user_id": u["id"]})
            if not cc:
                raise HTTPException(status_code=404, detail="Credit card not found.")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid credit card ID.")
            
        cc_id = credit_card_id
        
        if statement_period:
            existing_stmt = await db.statement_history.find_one({
                "credit_card_id": cc_id,
                "statement_period": statement_period,
                "user_id": u["id"]
            })
            if existing_stmt:
                if conflict_resolution == "replace":
                    await db.expenses.delete_many({
                        "creditCardId": cc_id,
                        "statement_period": statement_period,
                        "user_id": u["id"]
                    })
                    await db.statement_history.delete_many({
                        "credit_card_id": cc_id,
                        "statement_period": statement_period,
                        "user_id": u["id"]
                    })
                elif conflict_resolution != "append":
                    raise HTTPException(status_code=409, detail="This statement has already been imported.")

    existing_hashes = await get_existing_hashes(u["id"], db, 1000)
        
    docs_to_insert = []
    for txn in transactions:
        if txn.get("status") in ["Duplicate", "Skipped"] and conflict_resolution != "replace":
            continue
            
        h = f"{txn.get('date')}_{txn.get('merchant')}_{txn.get('amount')}"
        if h in existing_hashes and conflict_resolution != "replace":
            continue 
            
        doc = {
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
        }
        if statement_period and statement_type == "credit_card":
            doc["statement_period"] = statement_period
            
        docs_to_insert.append(doc)
        existing_hashes.add(h)
        
    if docs_to_insert:
        await db.expenses.insert_many(docs_to_insert)
        inserted_count = len(docs_to_insert)
        
    # Store import history
    hist = {
        "user_id": u["id"],
        "filename": filename,
        "statementType": statement_type,
        "transactionsImported": inserted_count,
        "status": "Success",
        "importedAt": now.isoformat()
    }
    if statement_type == "credit_card":
        hist["credit_card_id"] = cc_id
        if statement_period:
            hist["statement_period"] = statement_period
        if cc_details.get("due_date"):
            hist["due_date"] = cc_details["due_date"]
        if cc_details.get("statement_date"):
            hist["statement_date"] = cc_details["statement_date"]
        if cc_details.get("outstanding"):
            hist["outstanding_amount"] = cc_details["outstanding"]
        if cc_details.get("minimum_due"):
            hist["minimum_due"] = cc_details["minimum_due"]
            
    await db.statement_history.insert_one(hist)
    
    summary = await summarize_import_ai(docs_to_insert, groq_client=groq_client)
    
    if inserted_count > 0:
        await send_to_user(u["id"], "Statement Imported", f"{inserted_count} transactions imported via {statement_type}.", "statement")
    
    invalidate_insights_cache(u["id"])

    return {
        "message": f"{inserted_count} transactions imported successfully.",
        "summary": summary
    }
