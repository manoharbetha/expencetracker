import re

def detect_statement_source(text: str) -> str:
    """
    Scans the extracted text of the first few pages to detect the origin of the statement.
    """
    text_upper = text.upper()
    
    if "GOOGLE PAY" in text_upper or "GPAY" in text_upper or "GOOGLE INDIA" in text_upper:
        return "GOOGLE_PAY"
    if "PAYTM" in text_upper:
        return "PAYTM"
    if "PHONEPE" in text_upper:
        return "PHONEPE"
    if "STATE BANK OF INDIA" in text_upper or "SBI" in text_upper:
        return "SBI"
    if "HDFC BANK" in text_upper:
        return "HDFC"
    if "ICICI BANK" in text_upper:
        return "ICICI"
        return "AXIS"
        
    return "GENERIC"

def detect_statement_type(text: str) -> str:
    """
    Detects if the statement is a credit card or a bank statement using keywords.
    """
    text_upper = text.upper()
    
    cc_keywords = [
        "CREDIT LIMIT",
        "AVAILABLE CREDIT LIMIT",
        "MINIMUM AMOUNT DUE",
        "PAYMENT DUE DATE",
        "CARD NUMBER",
        "OUTSTANDING",
        "STATEMENT DATE"
    ]
    
    bank_keywords = [
        "ACCOUNT NUMBER",
        "OPENING BALANCE",
        "CLOSING BALANCE",
        "IFSC",
        "DEBIT",
        "CREDIT"
    ]
    
    cc_score = sum(1 for kw in cc_keywords if kw in text_upper)
    bank_score = sum(1 for kw in bank_keywords if kw in text_upper)
    
    if cc_score >= 1 or cc_score >= bank_score and cc_score > 0:
        return "credit_card"
    else:
        return "bank"
