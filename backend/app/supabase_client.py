# Supabase client initialization
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy initialization - only create client when actually needed
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Get or create Supabase client (lazy initialization)"""
    global _supabase_client
    
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set")
        
        try:
            # Create client with just URL and key (no extra options)
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            logger.info("Supabase client initialized successfully")
        except TypeError as e:
            # Handle version compatibility issues
            logger.error(f"Supabase client initialization error: {e}")
            raise ValueError(f"Failed to initialize Supabase client: {e}")
    
    return _supabase_client

# For backward compatibility, create client at module level if credentials are available
try:
    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        supabase: Client = get_supabase_client()
    else:
        # Create a placeholder that will raise error on use
        class SupabasePlaceholder:
            def __getattr__(self, name):
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set")
        supabase = SupabasePlaceholder()
except Exception as e:
    logger.warning(f"Could not initialize Supabase client at module level: {e}")
    class SupabasePlaceholder:
        def __getattr__(self, name):
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set")
    supabase = SupabasePlaceholder()

