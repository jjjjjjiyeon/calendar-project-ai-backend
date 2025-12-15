// src/calendar/components/CalendarSidebar.jsx
import { useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./CalendarSidebar.css";

import { useCalendarStore } from "../../hooks/useCalendarStore";
import { useAuthStore } from "../../hooks/useAuthStore";

import AddCalendarModal from "./AddCalendarModal";
import RenameCalendarModal from "./RenameCalendarModal";

const SB_MODE_KEY = "sidebarMode";
const SB_CAL_ID_KEY = "sidebarCalId";

export const CalendarSidebar = () => {
  const {
    calendars = [],
    selectedCalendars = [],
    toggleCalendar,
    startLoadingCalendars,
    leaveCalendar, // ✨ 필수 수정: useCalendarStore에서 leaveCalendar 함수를 가져옴
  } = useCalendarStore();

  const { user } = useAuthStore();

  // ------ UI 상태 ------
  const [searchKeyword, setSearchKeyword] = useState("");

  const [mode, setMode] = useState("list"); // 'list' | 'details'
  const [detailCal, setDetailCal] = useState(null); // { id, name }

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState("");

  // ✅ 멤버 검색 상태
  const [memberQuery, setMemberQuery] = useState("");

  // 메뉴 상태
  const [openMenuId, setOpenMenuId] = useState(null); // 캘린더 kebab
  const [openMemberMenuId, setOpenMemberMenuId] = useState(null); // 멤버 kebab

  // 모달
  const [openAdd, setOpenAdd] = useState(false);
  const [openRename, setOpenRename] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);

  // 상세 상태 복원용
  const restoredRef = useRef(false);

  // ------ 초기 로딩 ------
  useEffect(() => {
    startLoadingCalendars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 캘린더 목록 로딩 후 상세 상태 복원
  useEffect(() => {
    if (restoredRef.current) return;
    const modeSaved = localStorage.getItem(SB_MODE_KEY);
    const calIdSaved = localStorage.getItem(SB_CAL_ID_KEY);
    if (modeSaved === "details" && calIdSaved) {
      const cal = calendars.find((c) => String(c.id) === String(calIdSaved));
      if (cal) {
        restoredRef.current = true;
        openDetails(cal);
      }
    }
  }, [calendars]);

  // ------ 헬퍼 ------
  const visibleCalendars = calendars.filter((c) =>
    c.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const isOwner =
    mode === "details" &&
    members.some((m) => m.role === "owner" && m._id === user?.uid);

  // ✅ 멤버 검색 필터
  const filteredMembers =
    memberQuery.trim() === ""
      ? members
      : members.filter((m) => {
          const q = memberQuery.toLowerCase();
          return (
            (m.name || "").toLowerCase().includes(q) ||
            (m.email || "").toLowerCase().includes(q)
          );
        });

  // ------ API 액션 ------
  const handleCopyLink = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/calendars/${id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": localStorage.getItem("token"),
        },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.msg || "링크 생성 실패");
      const linkToCopy = data.appInviteUrl || data.apiJoinUrl;
      await navigator.clipboard.writeText(linkToCopy);
      setOpenMenuId(null);
      alert("공유 링크가 복사되었습니다!");
    } catch (e) {
      console.error(e);
      alert("링크 복사 실패");
    }
  };

  const handleDeleteCalendar = async (id) => {
    if (!confirm("이 캘린더를 삭제할까요? (관련 일정도 모두 삭제됩니다)")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/calendars/${id}`, {
        method: "DELETE",
        headers: { "x-token": localStorage.getItem("token") },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.msg || "삭제 실패");
      alert("삭제되었습니다.");
      setOpenMenuId(null);
      await startLoadingCalendars();

      if (detailCal?.id === String(id)) handleBackToList();
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const openDetails = async (cal) => {
    const id = String(cal.id);
    // 저장(새로고침 복원용)
    localStorage.setItem(SB_MODE_KEY, "details");
    localStorage.setItem(SB_CAL_ID_KEY, id);

    setMode("details");
    setDetailCal({ id, name: cal.name });
    setMembers([]);
    setMembersError("");
    setMemberQuery("");          // ✅ 디테일 들어올 때 검색어 초기화
    setLoadingMembers(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/calendars/${id}/members`, {
        headers: { "x-token": localStorage.getItem("token") },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.msg || "멤버 조회 실패");
      setMembers(data.members || []);
    } catch (e) {
      console.error(e);
      setMembersError("멤버 목록을 가져오지 못했습니다.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleBackToList = () => {
    setMode("list");
    setDetailCal(null);
    setMembers([]);
    setMembersError("");
    setMemberQuery("");          // ✅ 초기화
    localStorage.removeItem(SB_MODE_KEY);
    localStorage.removeItem(SB_CAL_ID_KEY);
  };

  const updateMemberRole = async (memberId, role) => {
    if (!detailCal) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/calendars/${detailCal.id}/members/${memberId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({ role }),
        }
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.msg || "권한 변경 실패");

      setMembers((prev) =>
        prev.map((m) => (m._id === memberId ? { ...m, role } : m))
      );
      setOpenMemberMenuId(null);
    } catch (e) {
      console.error(e);
      alert("권한 변경 실패");
    }
  };

  const removeMember = async (memberId) => {
    if (!detailCal) return;
    if (!confirm("이 멤버를 캘린더에서 제거할까요?")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/calendars/${detailCal.id}/members`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({ memberId }),
        }
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.msg || "멤버 제거 실패");

      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      setOpenMemberMenuId(null);
    } catch (e) {
      console.error(e);
      alert("멤버 제거 실패");
    }
  };

  // 바깥 클릭 시 팝오버 닫기
  useEffect(() => {
    const onDocClick = () => {
      setOpenMenuId(null);
      setOpenMemberMenuId(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="sidebar">
      {/* ---------- 상단 헤더 ---------- */}
      {mode === "list" ? (
        <div className="sidebar-topbar">
          <button className="btn-add full" onClick={() => setOpenAdd(true)}>
            + 새 캘린더
          </button>
        </div>
      ) : (
        <div className="sidebar-topbar detail">
          <button className="back-btn" onClick={handleBackToList} aria-label="뒤로가기">
            ←
          </button>
          <h3 className="sidebar-title">{detailCal?.name || "캘린더"}</h3>
          <div className="header-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="kebab-btn"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId((prev) => (prev === detailCal?.id ? null : detailCal?.id));
              }}
              aria-label="캘린더 메뉴"
            >
              ⋯
            </button>
            {openMenuId === detailCal?.id && (
              <div className="calendar-menu">
                <button className="menu-item" onClick={() => handleCopyLink(detailCal.id)}>
                  링크 복사
                </button>
                {/* 🔥 owner만 수정 가능 (ID 비교 안정화) */}
{calendars.find((c) => String(c.id) === String(detailCal.id))?.role === "owner" && (
  <button
    className="menu-item"
    onClick={() => {
      setRenameTarget(detailCal);
      setOpenRename(true);
      setOpenMenuId(null);
    }}
  >
    캘린더 수정
  </button>
)}

{/* 🔥 owner는 삭제 / others는 나가기 (ID 비교 안정화) */}
{calendars.find((c) => String(c.id) === String(detailCal.id))?.role === "owner" ? (
  <button
    className="menu-item danger"
    onClick={() => handleDeleteCalendar(detailCal.id)}
  >
    캘린더 삭제
  </button>
) : (
  <button
    className="menu-item danger"
    onClick={async () => {
      const ok = await leaveCalendar(detailCal.id);
      if (ok) {
        alert("캘린더에서 나갔습니다.");
        handleBackToList();
        setOpenMenuId(null);
      }
    }}
  >
    캘린더 나가기
  </button>
)}

              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- 미니 달력 (목록 모드에서만) ---------- */}
      {mode === "list" && (
        <div className="mini-calendar">
          <Calendar
            locale="ko"
            formatDay={(locale, date) => date.getDate()}
            formatMonthYear={(locale, date) =>
              `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`
            }
          />
        </div>
      )}

      {/* ---------- 본문 ---------- */}
      {mode === "list" ? (
        <div className="calendar-section">
          <h4>캘린더</h4>
          <div className="calendar-search-wrap">
            <input
              className="calendar-search"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="캘린더 검색…"
              aria-label="캘린더 검색"
            />
          </div>

          <ul className="calendar-list">
            {visibleCalendars.map((cal) => {
              const id = String(cal.id);
              
              // 🔥 이 위치에 다음 코드를 추가하고 콘솔을 확인해 보세요.
              //console.log(`캘린더 이름: ${cal.name}, 현재 역할: ${cal.role}`);
              // console.log(cal); // 전체 객체를 봐도 좋습니다.

              return (
                <li key={id} className="calendar-item">
                  <div className="calendar-item-row" style={{ gap: 8 }}>
                    <input
                      type="checkbox"
                      className="calendar-checkbox"
                      checked={(selectedCalendars || []).includes(id)}
                      onChange={() => toggleCalendar(id)}
                      title="캘린더 표시/숨김"
                    />
                    <button className="calendar-name-btn" onClick={() => openDetails(cal)}>
                      {cal.name}
                    </button>
                  </div>

                  <div className="calendar-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="kebab-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === id ? null : id));
                      }}
                      aria-label="캘린더 메뉴"
                    >
                      ⋯
                    </button>

                    {openMenuId === id && (
                      <div className="calendar-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="menu-item" onClick={() => handleCopyLink(id)}>
                          링크 복사
                        </button>
                        {/* 🔥 owner만 수정 가능 */}
{cal.role === "owner" && (
  <button
    className="menu-item"
    onClick={() => {
      setRenameTarget({ id, name: cal.name });
      setOpenRename(true);
      setOpenMenuId(null);
    }}
  >
    캘린더 수정
  </button>
)}

{/* 🔥 owner는 삭제 / others는 나가기 */}
{cal.role === "owner" ? (
  <button
    className="menu-item danger"
    onClick={() => handleDeleteCalendar(id)}
  >
    캘린더 삭제
  </button>
) : (
  <button
    className="menu-item danger"
    onClick={async () => {
      const ok = await leaveCalendar(id);
      if (ok) {
        alert("캘린더에서 나갔습니다.");
        setOpenMenuId(null);
      }
    }}
  >
    캘린더 나가기
  </button>
)}

                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="calendar-section">
          <h4>참여자</h4>

          {/* ✅ 참여자 검색 UI */}
          <div className="member-search-wrap">
            <input
              className="member-search"
              type="search"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setMemberQuery(''); }}
              placeholder="이름 또는 이메일 검색…"
              aria-label="참여자 검색"
            />

          </div>

          <div className="members-panel">
            {loadingMembers ? (
              <div className="members-loading">불러오는 중…</div>
            ) : membersError ? (
              <div className="members-empty">{membersError}</div>
            ) : filteredMembers.length === 0 ? (
              <div className="members-empty">검색 결과가 없습니다.</div>
            ) : (
              <ul className="members-list">
                {filteredMembers.map((m) => {
                  const isOwnerRow = m.role === "owner";
                  const isMe = m._id === user?.uid;
                  return (
                    <li key={m._id} className="member-row">
                      <div className="member-main">
                        <div className="member-avatar" aria-hidden="true">
                          {m.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="member-texts">
                          <strong>{m.name}</strong>
                          <div className="muted">{m.email}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {m.role && m.role !== "member" && (
                          <span className={`role-badge ${m.role}`}>{m.role}</span>
                        )}

                        {isOwner && !isOwnerRow && (
                          <div className="member-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="kebab-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMemberMenuId((prev) => (prev === m._id ? null : m._id));
                              }}
                              aria-label="멤버 메뉴"
                            >
                              ⋯
                            </button>

                            {openMemberMenuId === m._id && (
                              <div className="calendar-menu" onClick={(e) => e.stopPropagation()}>
                                {m.role !== "editor" && (
                                  <button
                                    className="menu-item"
                                    onClick={() => updateMemberRole(m._id, "editor")}
                                  >
                                    편집 권한 부여
                                  </button>
                                )}
                                {m.role !== "viewer" && (
                                  <button
                                    className="menu-item"
                                    onClick={() => updateMemberRole(m._id, "viewer")}
                                  >
                                    보기 전용으로 전환
                                  </button>
                                )}
                                {!isMe && (
                                  <button
                                    className="menu-item danger"
                                    onClick={() => removeMember(m._id)}
                                  >
                                    멤버 제거
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ---------- 모달들 ---------- */}
      <AddCalendarModal
        isOpen={openAdd}
        onClose={() => setOpenAdd(false)}
        onDone={async () => {
          setOpenAdd(false);
          await startLoadingCalendars();
        }}
      />

      <RenameCalendarModal
        isOpen={openRename}
        onClose={() => setOpenRename(false)}
        calendar={renameTarget}
        onRenamed={async (newName) => {
          setOpenRename(false);
          await startLoadingCalendars();
          if (detailCal && renameTarget && renameTarget.id === detailCal.id) {
            // 헤더명 즉시 반영
            setDetailCal((s) => (s ? { ...s, name: newName } : s));
          }
        }}
      />
    </div>
  );
};