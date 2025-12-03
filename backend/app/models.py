# Data models for API requests and database
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from app.utils.security import validate_password_strength, sanitize_input, validate_full_name

# Question Models
class QuestionOption(BaseModel):
    id: UUID
    question_id: UUID
    option_text: str
    option_value: str
    order: int

class SubQuestionOption(BaseModel):
    id: UUID
    sub_question_id: UUID
    option_text: str
    option_value: str
    order: int

class SubQuestion(BaseModel):
    id: UUID
    parent_question_id: UUID
    sub_question_text: str
    type: str  # 'single_select' or 'multi_select'
    order: int
    options: Optional[List[SubQuestionOption]] = []

class Question(BaseModel):
    id: UUID
    order: int
    text: str
    type: str  # 'single_select', 'multi_select', 'with_sub_questions'
    required: bool = True
    options: Optional[List[QuestionOption]] = []
    sub_questions: Optional[List[SubQuestion]] = []

# Response Models
class AnswerSelection(BaseModel):
    question_id: UUID
    selected_option_ids: List[UUID] = Field(..., max_items=50)  # Limit to prevent DoS
    sub_question_answers: Optional[Dict[str, List[UUID]]] = Field(None, max_items=50)  # Limit sub-questions

class ResponseCreate(BaseModel):
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Date in YYYY-MM-DD format")
    answers: List[AnswerSelection] = Field(..., min_items=1, max_items=20)  # Limit to 20 answers
    
    @validator('answers')
    def validate_answers(cls, v):
        if not v:
            raise ValueError('Must provide at least one answer')
        if len(v) > 20:
            raise ValueError('Maximum 20 answers allowed per response')
        return v

class ResponseInDB(BaseModel):
    id: UUID
    user_id: UUID
    date: str
    submitted_at: datetime
    answers: List[AnswerSelection]

# User Profile Model
class UserProfile(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    pref_reminder: Optional[bool] = True
