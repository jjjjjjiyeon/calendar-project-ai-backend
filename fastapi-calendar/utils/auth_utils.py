from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database import user_collection  # ✅ MongoDB 연결
from bson import ObjectId  # ObjectId 변환용

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 1️⃣ JWT 토큰 디코드
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception

        # 2️⃣ 이메일로 MongoDB에서 사용자 찾기
        user = user_collection.find_one({"email": email})
        if user is None:
            raise credentials_exception

        # 3️⃣ 사용자 반환 (_id 포함)
        return user

    except JWTError:
        raise credentials_exception
