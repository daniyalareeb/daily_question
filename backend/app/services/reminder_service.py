# Reminder service for notifications

import asyncio
import resend
from datetime import datetime, time
from typing import List, Dict
from app.config import RESEND_API_KEY, REMINDER_TIME
from app.database import users_collection, responses_collection
from app.api.auth import get_current_user
import json

# Initialize Resend
resend.api_key = RESEND_API_KEY

async def send_email_reminder(user_email: str, user_name: str = None):
    """Send email reminder using Resend"""
    try:
        params = {
            "from": "Daily Questions <noreply@dailyquestions.app>",
            "to": [user_email],
            "subject": "Time for your daily reflection! 🌟",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Daily Reflection Time</h2>
                <p>Hi {user_name or 'there'}!</p>
                <p>It's time for your daily self-reflection. Take a few minutes to answer today's questions and track your thoughts and feelings.</p>
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">Today's Questions:</h3>
                    <ul style="color: #6B7280;">
                        <li>How do you feel about the positive impact of AI?</li>
                        <li>How do you feel about your course?</li>
                        <li>How do you feel about your learning progression?</li>
                        <li>How do you feel about your finances?</li>
                        <li>How do you feel about your friendships?</li>
                        <li>How do you feel about your overall well-being today?</li>
                    </ul>
                </div>
                <p>Your insights help you understand patterns in your thoughts and feelings over time.</p>
                <p style="color: #6B7280; font-size: 14px;">
                    This is an automated reminder. You can adjust your notification preferences in your account settings.
                </p>
            </div>
            """
        }
        
        email = resend.Emails.send(params)
        return {"success": True, "email_id": email.id}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def send_web_push_reminder(user_id: str, subscription_data: Dict):
    """Send web push notification"""
    try:
        # This would integrate with a web push service
        # For now, we'll return a placeholder
        return {"success": True, "message": "Web push notification sent"}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def get_users_for_reminder():
    """Get users who should receive reminders"""
    try:
        # Get users who have reminder preferences enabled
        users = await users_collection.find({
            "pref_reminder": True
        }).to_list(length=None)
        
        return users
    except Exception as e:
        print(f"Error getting users for reminder: {e}")
        return []

async def check_user_has_submitted_today(user_id: str) -> bool:
    """Check if user has already submitted responses for today"""
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        response = await responses_collection.find_one({
            "userId": user_id,
            "date": today
        })
        return response is not None
    except Exception as e:
        print(f"Error checking user submission: {e}")
        return False

async def send_daily_reminders():
    """Send daily reminders to all eligible users"""
    try:
        users = await get_users_for_reminder()
        results = []
        
        for user in users:
            user_id = user["uid"]
            user_email = user.get("email")
            user_name = user.get("displayName")
            
            # Check if user has already submitted today
            has_submitted = await check_user_has_submitted_today(user_id)
            
            if not has_submitted and user_email:
                # Send email reminder
                email_result = await send_email_reminder(user_email, user_name)
                results.append({
                    "user_id": user_id,
                    "email": user_email,
                    "email_result": email_result
                })
            
            # TODO: Add web push notification logic here
            # if user has web push subscription
        
        return {
            "success": True,
            "total_users": len(users),
            "reminders_sent": len([r for r in results if r["email_result"]["success"]]),
            "results": results
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

async def schedule_daily_reminders():
    """Schedule daily reminders at the configured time"""
    reminder_hour, reminder_minute = map(int, REMINDER_TIME.split(":"))
    
    while True:
        now = datetime.now()
        target_time = now.replace(hour=reminder_hour, minute=reminder_minute, second=0, microsecond=0)
        
        # If target time has passed today, schedule for tomorrow
        if now >= target_time:
            target_time = target_time.replace(day=target_time.day + 1)
        
        # Calculate seconds until target time
        wait_seconds = (target_time - now).total_seconds()
        
        print(f"Next reminder scheduled for {target_time}")
        await asyncio.sleep(wait_seconds)
        
        # Send reminders
        result = await send_daily_reminders()
        print(f"Reminder result: {result}")

# Background task to start the reminder scheduler
async def start_reminder_scheduler():
    """Start the reminder scheduler in the background"""
    asyncio.create_task(schedule_daily_reminders())

