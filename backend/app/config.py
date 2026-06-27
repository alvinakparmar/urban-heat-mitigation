import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv("SUPABASE_JWT_SECRET")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./data/models")
    API_VERSION: str = "v1"
    API_PREFIX: str = f"/api/{API_VERSION}"

config = Config()
