# Question database operations
from app.database import questions_collection
from app.models import Question
from typing import List, Optional

async def get_questions() -> List[Question]:
    cursor = questions_collection.find().sort("order",1)
    return await cursor.to_list(length=None)

async def get_question_by_id(question_id: str) -> Optional[Question]:
    return await questions_collection.find_one({"_id": question_id})