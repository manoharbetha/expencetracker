import io
import json
from typing import List, Dict, Any
import pdfplumber
from groq import AsyncGroq

from app.core.config import get_settings
from app.services.statement_detector import detect_statement_source
from app.services.parsers.generic_parser import GenericParser
from app.services.parsers.googlepay_parser import GooglePayParser

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
        return {"items": [], "error": f"PDF read error: {e}", "source": "UNKNOWN"}
        
    source = detect_statement_source(text_preview)
    
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
        print(f"Parser error: {e}")
        
    # 3. AI Fallback if Parser fails
    fallback_used = False
    if not transactions and len(text_preview.strip()) > 50:
        fallback_used = True
        transactions = await extract_with_ai_fallback(text_preview)

    return {
        "items": transactions,
        "source": source,
        "pages_read": pages_read,
        "text_length": len(text_preview),
        "fallback_used": fallback_used,
        "error": None if transactions else "Parser pattern mismatch. AI fallback triggered but yielded 0 results."
    }

async def extract_with_ai_fallback(text_chunk: str) -> List[Dict[str, Any]]:
    s = get_settings()
    if not s.groq_api_key:
        return []
        
    client = AsyncGroq(api_key=s.groq_api_key)
    prompt = """
    Extract all financial transactions from this text.
    Return ONLY a JSON object with a single key "transactions" which is an array of objects.
    Each object must have: "date" (YYYY-MM-DD), "merchant" (string), "amount" (number), "is_credit" (boolean).
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
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
        content = resp.choices[0].message.content
        if content:
            data = json.loads(content)
            return data.get("transactions", [])
    except Exception as e:
        print(f"Groq fallback failed: {e}")
    return []
