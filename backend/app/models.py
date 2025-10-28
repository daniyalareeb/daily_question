from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Answer(BaseModel):
    questionId: str
    text: str
    keywords: Optional[List[str]] = []

class ResponseCreate(BaseModel):
    date: str  # YYYY-MM-DD
    answers: List[Answer]

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
