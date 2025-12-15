import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const joinCalendar = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/calendars/join/${token}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": localStorage.getItem("token"),
          },
        });
        const data = await res.json();
        if (data.ok) {
          alert("✅ 캘린더에 참여되었습니다!");
          navigate("/", { replace: true });
        } else {
          alert(data.msg || "❌ 유효하지 않은 초대 링크입니다.");
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error(error);
        alert("서버 연결 중 오류가 발생했습니다.");
        navigate("/", { replace: true });
      }
    };
    if (token) joinCalendar();
  }, [token, navigate]);

  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "Noto Sans KR" }}>
      <h2>캘린더에 참여 중...</h2>
      <p>잠시만 기다려주세요 ⏳</p>
    </div>
  );
}
