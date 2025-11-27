#!/usr/bin/env python3
"""
Seed script to populate Supabase with all 8 daily questions
Run this after setting up Supabase schema
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.supabase_client import supabase
from uuid import uuid4

# Question data based on provided questions
QUESTIONS_DATA = [
    {
        "order": 1,
        "text": "How are you feeling today?",
        "type": "single_select",
        "required": True,
        "options": [
            {"text": "Excited", "value": "excited"},
            {"text": "Happy", "value": "happy"},
            {"text": "Contented", "value": "contented"},
            {"text": "Normal", "value": "normal"},
            {"text": "Low energy", "value": "low_energy"},
            {"text": "Depressed", "value": "depressed"},
            {"text": "Agitated/Stressed", "value": "agitated_stressed"},
        ]
    },
    {
        "order": 2,
        "text": "What did you eat today?",
        "type": "with_sub_questions",
        "required": True,
        "options": [
            {"text": "Breakfast", "value": "breakfast"},
            {"text": "Lunch", "value": "lunch"},
            {"text": "Dinner", "value": "dinner"},
            {"text": "I didn't eat", "value": "no_eat"},
        ],
        "sub_questions": [
            {
                "text": "What did you eat for Breakfast?",
                "type": "multi_select",
                "order": 1,
                "triggering_option_value": "breakfast",
                "options": [
                    {"text": "Healthy (Fruit & Veg)", "value": "healthy_breakfast"},
                    {"text": "Easy food/Snacks", "value": "easy_breakfast"},
                    {"text": "I didn't eat", "value": "no_breakfast"},
                ]
            },
            {
                "text": "What did you eat for Lunch?",
                "type": "multi_select",
                "order": 2,
                "triggering_option_value": "lunch",
                "options": [
                    {"text": "Healthy (Fruit & Veg)", "value": "healthy_lunch"},
                    {"text": "Easy food/Snacks", "value": "easy_lunch"},
                    {"text": "I didn't eat", "value": "no_lunch"},
                ]
            },
            {
                "text": "What did you eat for Dinner?",
                "type": "multi_select",
                "order": 3,
                "triggering_option_value": "dinner",
                "options": [
                    {"text": "Healthy (Fruit & Veg)", "value": "healthy_dinner"},
                    {"text": "Easy food/Snacks", "value": "easy_dinner"},
                    {"text": "I didn't eat", "value": "no_dinner"},
                ]
            },
        ]
    },
    {
        "order": 3,
        "text": "How was your water Intake today?",
        "type": "single_select",
        "required": True,
        "options": [
            {"text": "Adequate (>1 litre)", "value": "adequate"},
            {"text": "Low (<1 litre)", "value": "low"},
        ]
    },
    {
        "order": 4,
        "text": "Did you exercise today?",
        "type": "single_select",
        "required": True,
        "options": [
            {"text": "Less < 1/2 hr", "value": "less_30min"},
            {"text": "More > 1/2 hr", "value": "more_30min"},
            {"text": "I didn't exercise today", "value": "no_exercise"},
        ]
    },
    {
        "order": 5,
        "text": "Did you socialise today?",
        "type": "with_sub_questions",
        "required": True,
        "options": [
            {"text": "Family", "value": "family"},
            {"text": "Friends", "value": "friends"},
            {"text": "Neighbour", "value": "neighbour"},
            {"text": "Stranger", "value": "stranger"},
            {"text": "I didn't socialize", "value": "no_socialize"},
        ],
        "sub_questions": [
            {
                "text": "How did you socialize with Family?",
                "type": "multi_select",
                "order": 1,
                "triggering_option_value": "family",
                "options": [
                    {"text": "In Person", "value": "family_in_person"},
                    {"text": "Phone", "value": "family_phone"},
                    {"text": "Text", "value": "family_text"},
                    {"text": "I didn't socialize", "value": "no_family"},
                ]
            },
            {
                "text": "How did you socialize with Friends?",
                "type": "multi_select",
                "order": 2,
                "triggering_option_value": "friends",
                "options": [
                    {"text": "In Person", "value": "friends_in_person"},
                    {"text": "Phone", "value": "friends_phone"},
                    {"text": "Text", "value": "friends_text"},
                    {"text": "I didn't socialize", "value": "no_friends"},
                ]
            },
            {
                "text": "How did you socialize with Neighbour?",
                "type": "multi_select",
                "order": 3,
                "triggering_option_value": "neighbour",
                "options": [
                    {"text": "In Person", "value": "neighbour_in_person"},
                    {"text": "Phone", "value": "neighbour_phone"},
                    {"text": "Text", "value": "neighbour_text"},
                    {"text": "I didn't socialize", "value": "no_neighbour"},
                ]
            },
            {
                "text": "How did you socialize with Stranger?",
                "type": "multi_select",
                "order": 4,
                "triggering_option_value": "stranger",
                "options": [
                    {"text": "In Person", "value": "stranger_in_person"},
                    {"text": "Phone", "value": "stranger_phone"},
                    {"text": "Text", "value": "stranger_text"},
                    {"text": "I didn't socialize", "value": "no_stranger"},
                ]
            },
        ]
    },
    {
        "order": 6,
        "text": "How Satisfying was your sleep last night?",
        "type": "single_select",
        "required": True,
        "options": [
            {"text": "Excellent", "value": "excellent"},
            {"text": "Good", "value": "good"},
            {"text": "Average", "value": "average"},
            {"text": "Poor", "value": "poor"},
            {"text": "Very Poor", "value": "very_poor"},
        ]
    },
    {
        "order": 7,
        "text": "What time did you go to sleep last night?",
        "type": "single_select",
        "required": True,
        "options": [
            {"text": "9pm", "value": "9pm"},
            {"text": "10pm", "value": "10pm"},
            {"text": "11pm", "value": "11pm"},
            {"text": "Midnight", "value": "midnight"},
            {"text": "After Midnight", "value": "after_midnight"},
        ]
    },
    {
        "order": 8,
        "text": "How many hours of sleep did you get last night?",
        "type": "single_select",
        "required": True,
        "options": [
            {"text": "Less than 3 hours", "value": "less_3h"},
            {"text": "3-4 hours", "value": "3_4h"},
            {"text": "5-6 hours", "value": "5_6h"},
            {"text": "7-8 hours", "value": "7_8h"},
            {"text": "8+ hours", "value": "8plus_h"},
        ]
    },
]

def seed_questions():
    """Seed all questions into Supabase"""
    print("Starting to seed questions...")
    
    try:
        # Check if questions already exist
        existing = supabase.table("questions").select("id").execute()
        if existing.data and len(existing.data) > 0:
            print(f"⚠️  {len(existing.data)} questions already exist. Skipping seed.")
            response = input("Do you want to delete existing questions and reseed? (yes/no): ")
            if response.lower() != 'yes':
                print("Aborted.")
                return
            
            # Delete existing questions (cascade will delete options and sub-questions)
            for q in existing.data:
                supabase.table("questions").delete().eq("id", q["id"]).execute()
            print("✅ Deleted existing questions")
        
        # Insert questions
        for q_data in QUESTIONS_DATA:
            question_id = str(uuid4())
            
            # Insert question
            question = {
                "id": question_id,
                "order": q_data["order"],
                "text": q_data["text"],
                "type": q_data["type"],
                "required": q_data.get("required", True)
            }
            
            result = supabase.table("questions").insert(question).execute()
            print(f"✅ Inserted question {q_data['order']}: {q_data['text'][:50]}...")
            
            # Insert question options (for single_select and multi_select)
            if "options" in q_data:
                option_records = []
                for idx, opt in enumerate(q_data["options"]):
                    option_records.append({
                        "id": str(uuid4()),
                        "question_id": question_id,
                        "option_text": opt["text"],
                        "option_value": opt["value"],
                        "order": idx + 1
                    })
                
                if option_records:
                    supabase.table("question_options").insert(option_records).execute()
                    print(f"   ✅ Inserted {len(option_records)} options")
            
            # Insert sub-questions (for with_sub_questions)
            if "sub_questions" in q_data:
                for sub_q_data in q_data["sub_questions"]:
                    sub_question_id = str(uuid4())
                    
                    sub_question = {
                        "id": sub_question_id,
                        "parent_question_id": question_id,
                        "sub_question_text": sub_q_data["text"],
                        "type": sub_q_data["type"],
                        "order": sub_q_data["order"],
                        "triggering_option_value": sub_q_data.get("triggering_option_value")
                    }
                    
                    supabase.table("sub_questions").insert(sub_question).execute()
                    print(f"   ✅ Inserted sub-question: {sub_q_data['text'][:50]}...")
                    
                    # Insert sub-question options
                    if "options" in sub_q_data:
                        sub_option_records = []
                        for idx, opt in enumerate(sub_q_data["options"]):
                            sub_option_records.append({
                                "id": str(uuid4()),
                                "sub_question_id": sub_question_id,
                                "option_text": opt["text"],
                                "option_value": opt["value"],
                                "order": idx + 1
                            })
                        
                        if sub_option_records:
                            supabase.table("sub_question_options").insert(sub_option_records).execute()
                            print(f"      ✅ Inserted {len(sub_option_records)} sub-options")
        
        print("\n✅ Successfully seeded all questions!")
        print(f"   Total questions: {len(QUESTIONS_DATA)}")
        
    except Exception as e:
        print(f"❌ Error seeding questions: {e}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    seed_questions()

