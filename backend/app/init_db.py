# Create database indexes for better performance
from app.database import responses_collection, users_collection, questions_collection
import asyncio

async def create_indexes():
    print("Creating database indexes...")
    
    try:
        await responses_collection.create_index(
            [("userId", 1), ("submittedAt", -1)],
            name="user_submitted_idx",
            background=True
        )
        print("✅ Created user_submitted_idx")
        
        await responses_collection.create_index(
            [("userId", 1), ("date", 1)],
            name="user_date_idx",
            background=True
        )
        print("✅ Created user_date_idx")
        
        try:
            await responses_collection.create_index(
                [("userId", 1), ("date", 1)],
                unique=True,
                name="user_date_unique_idx",
                background=True
            )
            print("✅ Created user_date_unique_idx (unique)")
        except Exception as e:
            print(f"⚠️ user_date_unique_idx may already exist: {e}")
        
        # Index for submittedAt queries
        await responses_collection.create_index(
            [("submittedAt", -1)],
            name="submitted_at_idx",
            background=True
        )
        print("✅ Created submitted_at_idx")
        
        try:
            await users_collection.create_index(
                [("uid", 1)],
                unique=True,
                name="uid_unique_idx",
                background=True
            )
            print("✅ Created uid_unique_idx (unique)")
        except Exception as e:
            print(f"⚠️ uid_unique_idx may already exist: {e}")
        
        try:
            await users_collection.create_index(
                [("email", 1)],
                unique=True,
                name="email_unique_idx",
                background=True
            )
            print("✅ Created email_unique_idx (unique)")
        except Exception as e:
            print(f"⚠️ email_unique_idx may already exist: {e}")
        
        # Index for reminder preferences
        await users_collection.create_index(
            [("pref_reminder", 1)],
            name="reminder_pref_idx",
            background=True
        )
        print("✅ Created reminder_pref_idx")
        
        await questions_collection.create_index(
            [("order", 1)],
            name="question_order_idx",
            background=True
        )
        print("✅ Created question_order_idx")
        
        print("\n✅ All indexes created successfully!")
        print("📊 Your database is now optimized for high performance!")
        
    except Exception as e:
        print(f"❌ Error creating indexes: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(create_indexes())

