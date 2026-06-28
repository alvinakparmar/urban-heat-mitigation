"""
Vercel ASGI entry point for the FastAPI backend.
Vercel's Python runtime detects the `app` object and serves it via ASGI.
"""
import sys
import os

# Ensure the backend root is on the Python path so `app.*` imports resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: F401  – re-exported for Vercel
