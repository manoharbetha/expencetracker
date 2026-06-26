import io
import json
from typing import List, Dict, Any
import logging
import pdfplumber
from groq import AsyncGroq

from app.core.config import get_settings
from app.services.statement_detector import detect_statement_source, detect_statement_type
from app.services.parsers.generic_parser import GenericParser
from app.services.parsers.googlepay_parser import GooglePayParser

logger = logging.getLogger("expencetracker")

async def extract_transactions_from_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """
    Coordinator function that detects source, routes to the correct parser,
    and falls back to Groq AI if zero transactions are found.
    """
    # 1. Detect Source
    text_preview = ""
    pages_read = 0
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_read = len(pdf.pages)
            for page in pdf.pages: # scan all pages
                text = page.extract_text()
                if text:
                    text_preview += text + "\n"
    except Exception as e:
        return {"items": [], "error": f"PDF read error: {e}", "source": "UNKNOWN", "statement_type": "bank"}
        
    source = detect_statement_source(text_preview)
    statement_type = detect_statement_type(text_preview)
    
    # 2. Route to Parser
    transactions = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            if source == "GOOGLE_PAY":
                parser = GooglePayParser(pdf)
            else:
                parser = GenericParser(pdf)
                
            transactions = parser.extract()
    except Exception as e:
        logger.error(f"Parser error occurred: {e}")
        
    # 3. AI Fallback if Parser fails
    fallback_used = False
    if not transactions and len(text_preview.strip()) > 50:
        fallback_used = True
        transactions = await extract_with_ai_fallback(text_preview)

    cc_details = {}
    if statement_type == "credit_card":
        cc_details = await extract_cc_details_with_ai(text_preview)

    return {
        "items": transactions,
        "source": source,
        "statement_type": statement_type,
        "cc_details": cc_details,
        "pages_read": pages_read,
        "text_length": len(text_preview),
        "fallback_used": fallback_used,
        "error": None if transactions else "Parser pattern mismatch. AI fallback triggered but yielded 0 results."
    }

async def extract_cc_details_with_ai(text_chunk: str) -> Dict[str, Any]:
    s = get_settings()
    if not s.groq_api_key:
        return {}
    client = AsyncGroq(api_key=s.groq_api_key)
    prompt = """
    Extract credit card details from this statement text.
    Return ONLY a JSON object with these keys (use null if not found):
    "credit_limit" (number), "outstanding" (number), "available_limit" (number), "minimum_due" (number), "due_date" (number 1-31), "statement_date" (string YYYY-MM-DD), "card_name" (string), "bank_name" (string).
    Statement Text:
    """ + text_chunk[:6000]
    try:
        resp = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a financial extraction API. Output JSON object only."},
                {"role": "user", "content": prompt}
            ],
            model=s.groq_model,
            temperature=0.0,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        content = resp.choices[0].message.content
        if content:
            return json.loads(content)
    except Exception as e:
        logger.error(f"Groq CC extraction failed: {e}")
    return {}

async def extract_with_ai_fallback(text_chunk: str) -> List[Dict[str, Any]]:
    s = get_settings()
    if not s.groq_api_key:
        return []
        
    client = AsyncGroq(api_key=s.groq_api_key)
    
    # Split text into manageable chunks (approx 6000 chars by line)
    lines = text_chunk.split('\n')
    chunks = []
    current_chunk = ""
    for line in lines:
        if len(current_chunk) + len(line) > 5500:
            chunks.append(current_chunk)
            current_chunk = line + "\n"
        else:
            current_chunk += line + "\n"
    if current_chunk:
        chunks.append(current_chunk)
        
    all_transactions = []
    
    for chunk in chunks:
        prompt = """
        Extract all financial transactions from this text. Ignore 'Fuel Surcharge Waiver', 'Reward Point', 'Payment Received', 'Credits', 'Opening Balance'.
        Return ONLY a JSON object with a single key "transactions" which is an array of objects.
        Each object must have: "date" (YYYY-MM-DD), "merchant" (string), "amount" (number), "is_credit" (boolean).
        Statement Text:
        """ + chunk
        
        try:
            resp = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a financial extraction API. Output JSON object only."},
                    {"role": "user", "content": prompt}
                ],
                model=s.groq_model,
                temperature=0.0,
                max_tokens=2048,
                response_format={"type": "json_object"}
            )
            content = resp.choices[0].message.content
            if content:
                data = json.loads(content)
                all_transactions.extend(data.get("transactions", []))
        except Exception as e:
            logger.error(f"Groq fallback failed for chunk: {e}")
            
    return all_transactions
