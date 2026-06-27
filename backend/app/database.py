from supabase import create_client, Client
from typing import Optional
from .config import config
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.supabase: Optional[Client] = None
        self._initialize()
    
    def _initialize(self):
        try:
            if not config.SUPABASE_URL or not config.SUPABASE_KEY:
                logger.warning("Supabase credentials not configured")
                return
            self.supabase = create_client(
                config.SUPABASE_URL,
                config.SUPABASE_KEY
            )
            logger.info("Supabase connection established")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase: {e}")
            raise
    
    def get_client(self) -> Client:
        if not self.supabase:
            raise ValueError("Supabase client not initialized")
        return self.supabase

db = Database()

def get_supabase() -> Client:
    return db.get_client()
