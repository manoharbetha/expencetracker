from typing import List, Dict, Any
from app.services.parsers.base_parser import BaseParser
import re

class GenericParser(BaseParser):
    def extract(self) -> List[Dict[str, Any]]:
        transactions = []
        
        # Pattern 1: DD/MM/YYYY
        date_pattern = re.compile(r"^(\d{1,2}[-/\s][a-zA-Z]{3}|\d{1,2})[-/\s]\d{2,4}")
        amount_pattern = re.compile(r"(\d{1,3}(?:,\d{3})*\.\d{2})\s*(Cr|Dr|CR|DR)?$")
        
        # 1. Try Table Extraction first
        for page in self.pdf_file.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row or len(row) < 3:
                        continue
                        
                    row_text = " ".join([str(c) for c in row if c])
                    date_match = date_pattern.search(row_text)
                    if date_match:
                        # Attempt to find amount in the last few columns
                        amt_col = str(row[-1]) if row[-1] else str(row[-2])
                        amt_match = re.search(r"(\d{1,3}(?:,\d{3})*\.\d{2})", amt_col)
                        if amt_match:
                            amt = float(amt_match.group(1).replace(",", ""))
                            desc = str(row[1]) + " " + str(row[2] if len(row) > 2 else "")
                            merchant = self.clean_merchant(desc)
                            
                            is_credit = "CR" in row_text.upper()
                            transactions.append({
                                "date": self.parse_date(date_match.group(0)),
                                "merchant": merchant,
                                "amount": amt,
                                "description": desc[:100],
                                "is_credit": is_credit,
                                "category": "Other"
                            })
                            
        # 2. If tables yielded nothing, try text line-by-line
        if not transactions:
            for page in self.pdf_file.pages:
                text = page.extract_text()
                if not text:
                    continue
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    date_match = date_pattern.search(line)
                    amount_match = amount_pattern.search(line)
                    
                    if date_match and amount_match:
                        date_str = date_match.group(0)
                        amt_str = amount_match.group(1).replace(",", "")
                        is_credit = bool(amount_match.group(2) and amount_match.group(2).upper() == "CR")
                        
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
