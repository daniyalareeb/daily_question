from fastapi import APIRouter, HTTPException
from app.database import questions_collection
from app.models import Question
from typing import List
import random

router = APIRouter()

# Default questions for the app
DEFAULT_QUESTIONS = [
    {
        "text": "How do you feel about the positive impact of AI?",
        "order": 1,
        "meta": ["technology", "ai", "future"]
    },
    {
        "text": "How do you feel about your course?",
        "order": 2,
        "meta": ["education", "learning", "academic"]
    },
    {
        "text": "How do you feel about your learning progression?",
        "order": 3,
        "meta": ["growth", "development", "skills"]
    },
    {
        "text": "How do you feel about your finances?",
        "order": 4,
        "meta": ["money", "financial", "security"]
    },
    {
        "text": "How do you feel about your friendships?",
        "order": 5,
        "meta": ["relationships", "social", "connections"]
    },
    {
        "text": "How do you feel about your overall well-being today?",
        "order": 6,
        "meta": ["health", "wellness", "general"]
    }
]

async def seed_questions():
    """Seed questions if they don't exist"""
    existing_count = await questions_collection.count_documents({})
    if existing_count == 0:
        questions_to_insert = []
        for i, q in enumerate(DEFAULT_QUESTIONS):
            questions_to_insert.append({
                "_id": f"q_{i+1}",
                "text": q["text"],
                "order": q["order"],
                "meta": q["meta"]
            })
        await questions_collection.insert_many(questions_to_insert)

@router.get("/", response_model=List[Question])
async def get_all_questions(randomize: bool = False):
    """Get all questions, optionally randomized"""
    await seed_questions()
    
    cursor = questions_collection.find().sort("order", 1)
    questions = await cursor.to_list(length=None)
    
    # Convert MongoDB _id to id for Pydantic model
    for question in questions:
        question["id"] = question.pop("_id")
    
    if randomize:
        random.shuffle(questions)
    
    return questions

@router.get("/{question_id}", response_model=Question)
async def get_question_by_id(question_id: str):
    """Get a specific question by ID"""
    question = await questions_collection.find_one({"_id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Convert MongoDB _id to id for Pydantic model
    question["id"] = question.pop("_id")
    return question

@router.post("/seed")
async def seed_questions_endpoint():
    """Manually seed questions (for admin use)"""
    await seed_questions()
    return {"message": "Questions seeded successfully"}
