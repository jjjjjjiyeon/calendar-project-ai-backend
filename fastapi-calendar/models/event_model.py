# models/event_model.py

from pydantic import BaseModel
from typing import Optional

class Event(BaseModel):
    title: str
    date: str  # ISO 형식 문자열 예: "2025-11-05"
    description: Optional[str] = None
