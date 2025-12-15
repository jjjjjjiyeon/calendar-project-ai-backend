from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal
from pydantic import BaseModel

class RoleUpdate(BaseModel):
    role: str

class Member(BaseModel):
    email: EmailStr
    role: Literal["viewer", "editor"] = "viewer"

class Calendar(BaseModel):
    name: str
    owner: EmailStr
    members: Optional[List[Member]] = []
    share_token: Optional[str] = None
