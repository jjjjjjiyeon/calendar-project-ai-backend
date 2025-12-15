# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.event_routes import router as event_router
from routes.auth_routes import router as auth_router
from routes.calendar_routes import router as calendar_router

app = FastAPI()

# CORS 설정 (React와 통신 가능하게)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시 도메인으로 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(event_router, prefix="/api/events")
app.include_router(auth_router, prefix="/api/users")
app.include_router(calendar_router)
# 실행 명령어: uvicorn main:app --reload
