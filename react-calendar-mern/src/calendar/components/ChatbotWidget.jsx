import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ChatbotWidget.css";

// ✅ ChatbotWidget.jsx 위치가: src/calendar/components/ChatbotWidget.jsx
// ✅ hooks는 보통: src/hooks/useCalendarStore.js
// 그래서 상대경로는 ../../hooks/... 가 맞아.
import { useCalendarStore } from "../../hooks/useCalendarStore";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([
    { sender: "ai", text: "안녕! 일정 추가/수정/삭제를 말로 해봐 🙂" },
  ]);
  const [loading, setLoading] = useState(false);

  const { selectedCalendars = [], startLoadingEvents } = useCalendarStore();

  // ✅ 지금 체크된 캘린더(첫 번째)로 AI 일정 넣기
  const selectedCalendarId = useMemo(() => {
    if (!selectedCalendars || selectedCalendars.length === 0) return "";
    return String(selectedCalendars[0]);
  }, [selectedCalendars]);

  // 캘린더 체크 안 했으면 챗봇 상단에 힌트 보여주기 용
  const calendarHint = selectedCalendarId
    ? `현재 선택: ${selectedCalendarId}`
    : "캘린더를 체크하면 그 캘린더에 추가돼!";

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다!");
      return;
    }

    if (!selectedCalendarId) {
      alert("먼저 왼쪽에서 캘린더를 체크하세요!");
      return;
    }

    const userText = message.trim();
    setChat((prev) => [...prev, { sender: "user", text: userText }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:8080/api/calendars/ai/command",
        {
          message: userText,
          calendarId: selectedCalendarId, // ✅ 핵심: 선택 캘린더 id를 같이 보냄
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let aiReply = "처리되었습니다!";
      if (res.data?.ok) {
        if (res.data.event) aiReply = "✅ 일정이 추가됐어! (화면에 반영할게)";
        else if (res.data.events) aiReply = "✅ 반복 일정이 추가됐어! (화면에 반영할게)";
        else if (res.data.msg) aiReply = res.data.msg;
      } else {
        aiReply = res.data?.msg || "처리 실패 😢";
      }

      setChat((prev) => [...prev, { sender: "ai", text: aiReply }]);

      // ✅ 핵심: DB 저장 후, 캘린더 화면 이벤트를 다시 불러오기
      await startLoadingEvents();
    } catch (err) {
      console.error(err);
      setChat((prev) => [
        ...prev,
        { sender: "ai", text: "오류가 발생했어 😢 서버/AI 실행 상태 확인해줘!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        className="cb-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chatbot"
      >
        ?
      </button>

      {/* 채팅창 */}
      {open && (
        <div className="cb-panel" role="dialog" aria-label="Calendar AI Chat">
          <div className="cb-header">
            <div className="cb-title">
              <div className="cb-title-main">캘린더 AI 비서</div>
              <div className="cb-title-sub">{calendarHint}</div>
            </div>

            <button className="cb-close" onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="cb-body">
            {chat.map((c, i) => (
              <div key={i} className={`cb-msg ${c.sender}`}>
                <div className="cb-bubble">{c.text}</div>
              </div>
            ))}
            {loading && (
              <div className="cb-msg ai">
                <div className="cb-bubble">처리 중…</div>
              </div>
            )}
          </div>

          <div className="cb-input">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="예: 2025-12-16 15:00에 회의 잡아줘"
              rows={1}
            />
            <button onClick={sendMessage} disabled={loading || !message.trim()}>
              전송
            </button>
          </div>
        </div>
      )}
    </>
  );
}
