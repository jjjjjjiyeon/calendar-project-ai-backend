// src/calendar/components/AddCalendarModal.jsx
import { useEffect, useState } from "react";
import "./AddCalendarModal.css";

export default function AddCalendarModal({ isOpen, onClose, onDone }) {
  const [tab, setTab] = useState("create"); // 'create' | 'join'
  const [name, setName] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  // 바디 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [isOpen]);

  if (!isOpen) return null;

  const onCreate = async () => {
    if (!name.trim()) return alert("캘린더 이름을 입력하세요.");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/calendars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.msg || "생성 실패");
      onDone?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert("생성 실패");
    }
  };

  const onJoin = async () => {
    const token = (inviteUrl.match(/invite\/([a-f0-9]+)/i)?.[1] ||
      inviteUrl.match(/join\/([a-f0-9]+)/i)?.[1] ||
      inviteUrl).trim();

    if (!token) return alert("공유 링크 또는 토큰을 붙여넣어 주세요.");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/calendars/join/${token}`,
        {
          method: "POST",
          headers: { "x-token": localStorage.getItem("token") },
        }
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.msg || "참여 실패");
      onDone?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert("참여 실패");
    }
  };

  return (
    <div className="acm-backdrop" onClick={onClose}>
      <div className="acm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="acm-header">
          <h3 className="acm-title">캘린더 추가</h3>
        </div>

        <div className="acm-tabs">
          <button
            className={`acm-tab ${tab === "create" ? "is-active" : ""}`}
            onClick={() => setTab("create")}
          >
            새 캘린더
          </button>
          <button
            className={`acm-tab ${tab === "join" ? "is-active" : ""}`}
            onClick={() => setTab("join")}
          >
            공유 링크로 추가
          </button>
        </div>

        <div className="acm-body">
          {tab === "create" ? (
            <div className="acm-field">
              <label>캘린더 이름</label>
              <input
                className="acm-input"
                placeholder="예) 가족, 팀 프로젝트"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="acm-hint">생성 후 멤버를 초대할 수 있어요.</div>
            </div>
          ) : (
            <div className="acm-field">
              <label>공유 링크 또는 토큰</label>
              <input
                className="acm-input"
                placeholder="초대 링크 전체 또는 토큰만 붙여넣기"
                value={inviteUrl}
                onChange={(e) => setInviteUrl(e.target.value)}
              />
              <div className="acm-hint">
                예: https://localhost:3000/invite/abcdef... 또는 abcdef...
              </div>
            </div>
          )}
        </div>

        <div className="acm-footer">
          <button className="acm-btn ghost" onClick={onClose}>
            취소
          </button>
          {tab === "create" ? (
            <button className="acm-btn primary" onClick={onCreate}>
              추가
            </button>
          ) : (
            <button className="acm-btn primary" onClick={onJoin}>
              참여
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
