from typing import List, Dict, Any
from app.services.parsers.base_parser import BaseParser
import re

class GenericParser(BaseParser):
    def extract(self) -> List[Dict[str, Any]]:
        transactions = []
        
        date_pattern = re.compile(r"^(\d{1,2}[-/\s][a-zA-Z]{3}|\d{1,2})[-/\s]\d{2,4}")
        amount_pattern = re.compile(r"(\d{1,3}(?:,\d{3})*\.\d{2})\s*(Cr|Dr|CR|DR|cr|dr)?$")
        
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
                
                # Check for ignore phrases
                line_lower = line.lower()
                if any(phrase in line_lower for phrase in ignore_phrases):
                    continue
                    
                date_match = date_pattern.search(line)
                amount_match = amount_pattern.search(line)
                
                if date_match and amount_match:
                    date_str = date_match.group(0)
                    amt_str = amount_match.group(1).replace(",", "")
                    cr_dr = amount_match.group(2)
                    is_credit = bool(cr_dr and cr_dr.upper() == "CR")
                    
                    desc_start = date_match.end()
                    desc_end = amount_match.start()
                    description = line[desc_start:desc_end].strip()
                    merchant = self.clean_merchant(description)
                    
                    transactions.append({
                        "date": self.parse_date(date_str),
                        "merchant": merchant,
                        "amount": float(amt_str),
                        "description": description[:100],
                        "is_credit": is_credit,
                        "category": "Other"
                    })
                        
        return transactions
