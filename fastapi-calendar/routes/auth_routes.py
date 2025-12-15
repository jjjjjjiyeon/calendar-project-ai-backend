# routes/auth_routes.py

from fastapi import APIRouter, HTTPException
from models.user_model import UserCreate, UserOut
from database import user_collection
from bson import ObjectId
from passlib.context import CryptContext
from models.user_model import UserLogin
from jose import JWTError, jwt
from datetime import datetime, timedelta
from utils.auth_utils import get_current_user
from fastapi import Depends

router = APIRouter()

# 비밀번호 암호화 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

@router.post("/register", response_model=UserOut)
def register(user: UserCreate):
    # 이미 존재하는 이메일 체크
    if user_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # 비밀번호 해싱
    hashed_pw = hash_password(user.password)

    # 유저 저장
    user_dict = {
        "email": user.email,
        "password": hashed_pw
    }
    result = user_collection.insert_one(user_dict)

    return {
        "id": str(result.inserted_id),
        "email": user.email
    }

# JWT 설정
SECRET_KEY = "your-secret-key"  # 실제 서비스에선 환경변수 사용!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login")
def login(user: UserLogin):
    # 사용자 확인
    db_user = user_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # 비밀번호 검증
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # JWT 토큰 생성
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"]
    }
