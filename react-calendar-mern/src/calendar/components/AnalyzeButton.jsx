import axios from "axios";
import { useState } from "react";
import { useCalendarStore } from "../../hooks/useCalendarStore";   // ⭐ 추가

export default function AnalyzeButton() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");

  const { startLoadingEvents } = useCalendarStore();   // ⭐ 일정 다시 불러오는 함수

  const sendMessage = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("로그인이 필요합니다!");
        return;
      }

      const res = await axios.post(
        "http://localhost:8080/api/calendars/ai/command",
        { message: message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResult(res.data);

      // ⭐⭐⭐ AI로 일정 추가 후, 화면 최신화!!
      await startLoadingEvents();

    } catch (error) {
      console.error(error);
      alert("AI 서버 요청 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ padding: "10px", border: "1px solid #ddd", marginTop: "10px" }}>
      <h3>AI에게 일정 요청하기</h3>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="예: 내일 3시에 회의 잡아줘"
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <button 
        onClick={sendMessage}
        style={{
          padding: "8px 12px",
          backgroundColor: "#4a68ff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}>
        AI에게 보내기
      </button>

      <pre
        style={{
          background: "#f5f5f5",
          padding: "10px",
          marginTop: "10px",
          whiteSpace: "pre-wrap"
        }}
      >
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
