// src/calendar/components/RenameCalendarModal.jsx
import { useEffect, useMemo, useState } from "react";
import "./RenameCalendarModal.css";

const API = import.meta.env.VITE_API_URL;

// 안전하게 문자열 ID 뽑기
const safeId = (v) => {
  const id = v?.id ?? v?._id ?? v ?? "";
  return id ? String(id) : "";
};

export default function RenameCalendarModal({
  isOpen,
  onClose,
  // 둘 중 하나 방식 지원
  calendar,          // { id, name } 혹은 {_id, name}
  calendarId,        // string (optional)
  currentName = "",  // string (optional)
  onRenamed,         // (newName: string) => void
}) {
  // 최종 사용할 ID/이름
  const effectiveId = useMemo(
    () => safeId(calendar) || safeId(calendarId),
    [calendar, calendarId]
  );
  const initialName = useMemo(
    () => (calendar?.name ?? currentName ?? ""),
    [calendar, currentName]
  );

  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setSaving(false);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const onSave = async () => {
    const newName = name.trim();
    if (!newName) return alert("이름을 입력해주세요.");
    if (!effectiveId) return alert("캘린더 ID가 유효하지 않습니다.");

    setSaving(true);
    try {
      const res = await fetch(`${API}/calendars/${effectiveId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.msg || "수정 실패");

      // 부모에서 사이드바/헤더명 반영
      onRenamed?.(newName);
      onClose?.();
    } catch (e) {
      console.error(e);
      alert(e.message || "수정 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rcm-backdrop" onClick={onClose}>
      <div className="rcm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="rcm-header">
          <h3 className="rcm-title">캘린더 이름 수정</h3>
        </div>

        <div className="rcm-body">
          <div className="rcm-field">
            <label>새 이름</label>
            <input
              className="rcm-input"
              placeholder="예) 가족, 팀 프로젝트"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="rcm-footer">
          <button className="rcm-btn ghost" onClick={onClose} disabled={saving}>
            취소
          </button>
          <button className="rcm-btn primary" onClick={onSave} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
