from typing import List, Dict, Any
from app.services.parsers.base_parser import BaseParser
import re

class GenericParser(BaseParser):
    def extract(self) -> List[Dict[str, Any]]:
        transactions = []
        
        # Regex to locate a date at the start of a transaction line (e.g. "18 May 26", "02-Jun-2026")
        date_pattern = re.compile(r"^(\d{1,2}[-/\s][a-zA-Z]{3}|\d{1,2})[-/\s]\d{2,4}")
        
        # Regex to match currency decimal values
        amount_pattern = re.compile(r"\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b")
        
        ignore_phrases = ["fuel surcharge waiver", "reward point", "payment received", "credits", "opening balance", "closing balance"]
        
        for page in self.pdf_file.pages:
            text = page.extract_text(layout=True)
            if not text:
                text = page.extract_text()
            if not text:
                continue
                
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check for ignore phrases
                line_lower = line.lower()
                if any(phrase in line_lower for phrase in ignore_phrases):
                    continue
                    
                date_match = date_pattern.search(line)
                if date_match:
                    date_str = date_match.group(0)
                    remaining = line[date_match.end():].strip()
                    
                    # Find all amount matches in the remaining line text
                    amount_matches = list(amount_pattern.finditer(remaining))
                    if not amount_matches:
                        continue
                        
                    # Rightmost amounts: last is running balance, second to last is transaction amount
                    if len(amount_matches) >= 2:
                        txn_amount_match = amount_matches[-2]
                    else:
                        txn_amount_match = amount_matches[-1]
                        
                    amt_str = txn_amount_match.group(0).replace(",", "")
                    
                    # Description is everything between the date and the transaction amount
                    description = remaining[:txn_amount_match.start()].strip()
                    merchant = self.clean_merchant(description)
                    
                    # Check for credit indicator after description (e.g. D vs C, or CR / DR)
                    text_after_desc = remaining[txn_amount_match.start():].lower()
                    is_credit = False
                    if re.search(r"\b(cr|credit|dep|deposit|interest|c)\b", text_after_desc):
                        is_credit = True
                    elif text_after_desc.endswith(" c") or text_after_desc.endswith(" cr"):
                        is_credit = True
                    
                    transactions.append({
                        "date": self.parse_date(date_str),
                        "merchant": merchant,
                        "amount": float(amt_str),
                        "description": description[:100],
                        "is_credit": is_credit,
                        "category": "Other"
                    })
                        
        return transactions
