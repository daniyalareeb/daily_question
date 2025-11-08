# Data models for API requests and database
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime

class Answer(BaseModel):
    questionId: str
    text: str
    keywords: Optional[List[str]] = []
    
    @validator('text')
    def clean_and_validate_text(cls, v):
        if not v:
            raise ValueError('Answer text cannot be empty')
        
        cleaned = v.strip()
        if not cleaned:
            raise ValueError('Answer text cannot be empty')
        
        cleaned = ' '.join(cleaned.split())
        cleaned = cleaned.replace('\x00', '').replace('\r', '')
        
        if len(cleaned) > 5000:
            raise ValueError('Answer text is too long (max 5000 characters)')
        
        return cleaned

class ResponseCreate(BaseModel):
    date: str  # YYYY-MM-DD
    answers: List[Answer]
    
    @validator('answers')
    def validate_answers_count(cls, v):
        if len(v) != 6:
            raise ValueError('Must provide exactly 6 answers')
        return v

class ResponseInDB(ResponseCreate):
    userId: str
    submittedAt: datetime
    keywords_agg: Optional[List[str]] = []

class Question(BaseModel):
    id: str
    order: int
    text: str
    meta: Optional[List[str]] = []

class UserProfile(BaseModel):
    uid: str
    email: str
    displayName: Optional[str]
    pref_reminder: Optional[bool] = True
