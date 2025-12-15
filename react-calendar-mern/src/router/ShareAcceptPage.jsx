// src/router/ShareAcceptPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCalendarStore } from "../hooks/useCalendarStore";
import { useAuthStore } from "../hooks/useAuthStore";

export const ShareAcceptPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { status } = useAuthStore();
  const { acceptShareLink, startLoadingCalendars } = useCalendarStore();
  const [msg, setMsg] = useState("처리 중…");

  useEffect(() => {
    const run = async () => {
      if (!token) return setMsg("잘못된 링크입니다.");
      if (status !== "authenticated") {
        setMsg("로그인이 필요합니다.");
        return;
      }
      try {
        await acceptShareLink(token);
        await startLoadingCalendars();
        setMsg("캘린더가 내 목록에 추가되었습니다.");
        setTimeout(() => navigate("/"), 800);
      } catch {
        setMsg("링크 수락 실패");
      }
    };
    run();
  }, [token, status]);

  if (status !== "authenticated")
    return (
      <div style={{ padding: 24 }}>
        <p>{msg}</p>
        <Link to="/auth/login">로그인 하러 가기</Link>
      </div>
    );

  return <div style={{ padding: 24 }}>{msg}</div>;
};
