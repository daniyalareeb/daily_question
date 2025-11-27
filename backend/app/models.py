# Data models for API requests and database
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

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
    selected_option_ids: List[UUID]  # For single-select, list will have 1 item
    sub_question_answers: Optional[Dict[str, List[UUID]]] = None  # sub_question_id -> [option_ids]

class ResponseCreate(BaseModel):
    date: str  # YYYY-MM-DD
    answers: List[AnswerSelection]
    
    @validator('answers')
    def validate_answers(cls, v):
        if not v:
            raise ValueError('Must provide at least one answer')
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
    display_name: Optional[str] = None
    pref_reminder: Optional[bool] = True
