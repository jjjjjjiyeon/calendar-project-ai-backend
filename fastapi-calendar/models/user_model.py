# models/user_model.py

from pydantic import BaseModel, EmailStr
from typing import Optional

# ✅ 요청용 모델 (회원가입, 로그인)
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# ✅ 로그인 요청용
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ✅ 응답용 모델
class UserOut(BaseModel):
    id: str
    email: EmailStr
