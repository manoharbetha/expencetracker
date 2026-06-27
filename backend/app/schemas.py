from datetime import date
from enum import Enum
from typing import Any, Optional, Dict
from pydantic import BaseModel, EmailStr, Field, field_validator

# Enums
class ExpenseCategory(str, Enum):
    food = "Food"
    travel = "Travel"
    shopping = "Shopping"
    bills = "Bills"
    education = "Education"
    entertainment = "Entertainment"
    health = "Health"
    other = "Other"

class PaymentMethod(str, Enum):
    bank = "Bank"
    upi = "UPI"
    cash = "Cash"
    credit_card = "Credit Card"
    debit_card = "Debit Card"
    net_banking = "Net Banking"
    other = "Other"


# Auth Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    monthlyIncome: float = Field(default=0.0, ge=0)

    @field_validator("name")
    @classmethod
    def name_no_special(cls, v: str) -> str:
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number.")
        special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`"
        if not any(c in special_chars for c in v):
            raise ValueError("Password must contain at least one special character (e.g. !@#$%^&*).")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    monthlyIncome: float = 0
    currency: str = "INR"
    country: str = "India"
    createdAt: str = ""

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    monthlyIncome: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, max_length=10)
    country: Optional[str] = Field(default=None, max_length=80)

# Expense Schemas
class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0)
    category: ExpenseCategory
    description: str = Field(..., min_length=1, max_length=200)
    paymentMethod: PaymentMethod
    date: date
    creditCardId: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_reasonable(cls, v: float) -> float:
        if v > 10_000_000:
            raise ValueError("Amount seems unreasonably large")
        return round(v, 2)

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = Field(default=None, min_length=1, max_length=200)
    paymentMethod: Optional[PaymentMethod] = None
    date: Optional[date] = None
    creditCardId: Optional[str] = None

# Goal Schemas
class GoalCreate(BaseModel):
    goalName: str = Field(..., min_length=2, max_length=120)
    targetAmount: float = Field(..., gt=0)
    savedAmount: float = Field(default=0.0, ge=0)
    deadline: date
    description: Optional[str] = Field(default=None, max_length=300)

    @field_validator("deadline")
    @classmethod
    def deadline_future(cls, v: date) -> date:
        if v <= date.today():
            raise ValueError("Deadline must be a future date")
        return v

class GoalUpdate(BaseModel):
    goalName: Optional[str] = Field(default=None, min_length=2, max_length=120)
    targetAmount: Optional[float] = Field(default=None, gt=0)
    savedAmount: Optional[float] = Field(default=None, ge=0)
    deadline: Optional[date] = None
    description: Optional[str] = Field(default=None, max_length=300)

class DebtType(str, Enum):
    borrowed = "borrowed"
    lent = "lent"

class DebtCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    amount: float = Field(..., gt=0)
    interestRate: float = Field(..., ge=0, le=100)
    emi: float = Field(..., gt=0)
    dueDate: date
    type: DebtType = DebtType.borrowed
    lender: Optional[str] = Field(default=None, max_length=120)
    notes: Optional[str] = Field(default=None, max_length=300)

class DebtUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=120)
    amount: Optional[float] = Field(default=None, gt=0)
    interestRate: Optional[float] = Field(default=None, ge=0, le=100)
    emi: Optional[float] = Field(default=None, gt=0)
    dueDate: Optional[date] = None
    type: Optional[DebtType] = None
    lender: Optional[str] = Field(default=None, max_length=120)
    notes: Optional[str] = Field(default=None, max_length=300)

# Notification Schemas
class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    message: str = Field(..., min_length=2, max_length=500)
    type: str = Field(default="info")
    dueDate: Optional[date] = None

# AI Schemas
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def prevent_prompt_injection(cls, v: str) -> str:
        import re
        patterns = [
            r"(?i)ignore\s+(?:previous|above)\s+instructions?",
            r"(?i)system\s+override",
            r"(?i)override\s+system",
            r"(?i)you\s+are\s+now",
            r"(?i)system:",
            r"(?i)assistant:"
        ]
        cleaned = v
        for p in patterns:
            cleaned = re.sub(p, "", cleaned)
        return cleaned.strip()

class PurchaseImpactRequest(BaseModel):
    item: str = Field(..., min_length=1, max_length=120)
    price: float = Field(..., gt=0)

class AIResponse(BaseModel):
    result: str

# Credit Card Schemas
class CreditCardCreate(BaseModel):
    cardName: str = Field(..., min_length=2, max_length=80)
    creditLimit: float = Field(..., gt=0)
    billingDate: int = Field(..., ge=1, le=31)
    dueDate: int = Field(..., ge=1, le=31)
    bankName: Optional[str] = None
    availableLimit: Optional[float] = None
    outstanding: Optional[float] = None
    minimumDue: Optional[float] = None
    statementDate: Optional[str] = None
    lastImported: Optional[str] = None

class CreditCardResponse(BaseModel):
    id: str
    cardName: str
    creditLimit: float
    currentUsage: float
    billingDate: int
    dueDate: int
    createdAt: str
    bankName: Optional[str] = None
    availableLimit: Optional[float] = None
    outstanding: Optional[float] = None
    minimumDue: Optional[float] = None
    statementDate: Optional[str] = None
    lastImported: Optional[str] = None

# Shared
class MessageResponse(BaseModel):
    message: str
