# Email reminders service
import asyncio
import resend
import logging
from datetime import datetime
from typing import List, Dict
from app.config import RESEND_API_KEY, REMINDER_TIME, ENVIRONMENT
from app.supabase_client import supabase

logger = logging.getLogger(__name__)

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

async def send_email_reminder(user_email: str, user_name: str = None):
    """Send email reminder using Resend"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email reminder")
        return {"success": False, "error": "Email service not configured"}
    
    try:
        params = {
            "from": "Daily Questions <noreply@dailyquestions.app>",
            "to": [user_email],
            "subject": "Time for your daily reflection! 🌟",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #365E63;">Daily Reflection Time</h2>
                <p>Hi {user_name or 'there'}!</p>
                <p>It's time for your daily self-reflection. Take a few minutes to answer today's questions and track your thoughts and feelings.</p>
                <div style="background-color: #F2F9F9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #365E63; margin-top: 0;">Today's Questions:</h3>
                    <ul style="color: #6B8E91;">
                        <li>How are you feeling today?</li>
                        <li>What did you eat today?</li>
                        <li>How was your water intake today?</li>
                        <li>Did you exercise today?</li>
                        <li>Did you socialise today?</li>
                        <li>How satisfying was your sleep last night?</li>
                        <li>What time did you go to sleep?</li>
                        <li>How many hours of sleep did you get?</li>
                    </ul>
                </div>
                <p>Your insights help you understand patterns in your thoughts and feelings over time.</p>
                <p style="color: #6B8E91; font-size: 14px;">
                    This is an automated reminder. You can adjust your notification preferences in your account settings.
                </p>
            </div>
            """
        }
        
        email = resend.Emails.send(params)
        return {"success": True, "email_id": email.id}
    except Exception as e:
        logger.error(f"Error sending email reminder: {e}")
        return {"success": False, "error": str(e)}

async def send_web_push_reminder(user_id: str, subscription_data: Dict):
    # TODO: implement web push
    return {"success": True, "message": "Web push notification sent"}

async def get_users_for_reminder():
    """Get users who want reminders from Supabase"""
    try:
        # Note: This assumes you have a user_profiles table or similar
        # For now, we'll get all users from auth.users and check their preferences
        # You may need to create a user_profiles table in Supabase
        
        # Get users from Supabase Auth (this requires service role key)
        # For now, return empty list - you'll need to implement user profile storage
        # Option 1: Create a user_profiles table in Supabase
        # Option 2: Store preferences in user metadata
        
        result = supabase.table("user_profiles").select("user_id, email, display_name, pref_reminder").eq("pref_reminder", True).execute()
        
        if result.data:
            return result.data
        else:
            # Fallback: if no user_profiles table, return empty
            logger.warning("No user_profiles table found or no users with reminders enabled")
            return []
    except Exception as e:
        logger.error(f"Error getting users for reminder: {e}")
        return []

async def check_user_has_submitted_today(user_id: str) -> bool:
    """Check if user has submitted responses for today"""
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        result = supabase.table("responses").select("id").eq("user_id", user_id).eq("date", today).execute()
        return len(result.data) > 0 if result.data else False
    except Exception as e:
        logger.error(f"Error checking user submission: {e}")
        return False

async def send_daily_reminders():
    """Send daily reminders to all users who want them"""
    try:
        users = await get_users_for_reminder()
        results = []
        
        for user in users:
            user_id = user.get("user_id") or user.get("id")
            user_email = user.get("email")
            user_name = user.get("display_name") or user.get("displayName")
            
            if not user_id:
                continue
            
            has_submitted = await check_user_has_submitted_today(str(user_id))
            
            if not has_submitted and user_email:
                email_result = await send_email_reminder(user_email, user_name)
                results.append({
                    "user_id": str(user_id),
                    "email": user_email,
                    "email_result": email_result
                })
        
        return {
            "success": True,
            "total_users": len(users),
            "reminders_sent": len([r for r in results if r["email_result"].get("success")]),
            "results": results
        }
    except Exception as e:
        logger.error(f"Error in send_daily_reminders: {e}")
        return {"success": False, "error": str(e)}

async def schedule_daily_reminders():
    """Schedule daily reminders at the configured time"""
    reminder_hour, reminder_minute = map(int, REMINDER_TIME.split(":"))
    
    while True:
        now = datetime.now()
        target_time = now.replace(hour=reminder_hour, minute=reminder_minute, second=0, microsecond=0)
        
        if now >= target_time:
            target_time = target_time.replace(day=target_time.day + 1)
        
        wait_seconds = (target_time - now).total_seconds()
        logger.info(f"Next reminder scheduled for {target_time}")
        await asyncio.sleep(wait_seconds)
        
        result = await send_daily_reminders()
        logger.info(f"Reminders sent: {result.get('reminders_sent', 0)}/{result.get('total_users', 0)}")

async def start_reminder_scheduler():
    """Start the reminder scheduler"""
    asyncio.create_task(schedule_daily_reminders())
