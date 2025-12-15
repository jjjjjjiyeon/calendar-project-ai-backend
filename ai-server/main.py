from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai

genai.configure(api_key="내키")

app = FastAPI()

class Message(BaseModel):
    message: str

@app.post("/ai/analyze")
def analyze(msg: Message):

    prompt = f"""
    너는 캘린더 비서 AI이다.
    아래 형식을 반드시 따르고, JSON만 출력해라.

    가능하면 date는 "2025-11-26" 이런 형식(YYYY-MM-DD)으로,
    time은 "16:00" 형식(HH:MM, 24시간제)으로 써라.

    반복 일정일 경우:
    - repeat: "weekly"
    - repeatCount: 몇 주 동안 반복할지 (숫자, 예: 4)

    {{
     "action": "add | update | delete | recommend | createCalendar",
     "title": "",
     "date": "",
     "time": "",
     "calendarId": "",
     "details": "",
     "repeat": "none | weekly",
     "repeatCount": 1
    }}

    사용자 메시지: {msg.message}
    """


    model = genai.GenerativeModel("models/gemini-pro-latest")
    
    response = model.generate_content(prompt)

    # -------------------------------
    # ⭐ 코드블록 제거하는 핵심 부분
    # -------------------------------    
    text = response.text
    clean = (
        text.replace("```json", "")
            .replace("```", "")
            .strip()
    )

    return {"result": clean}
