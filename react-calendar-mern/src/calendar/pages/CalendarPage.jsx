// src/calendar/pages/CalendarPage.jsx
import { useEffect, useState } from "react";
import { Calendar } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { Navbar } from "../";
import { CalendarSidebar } from "../components/CalendarSidebar";
import { CalendarModal } from "../components/CalendarModal";
import { CalendarEvent } from "../components/CalendarEvent";

import { useCalendarStore } from "../../hooks/useCalendarStore";
import { localizer, messagesKO } from "../../helpers/calendarLocalizer";

import "./CalendarPage.css";

export const CalendarPage = () => {
  const {
    user, // (선택) 만약 어딘가에서 쓰면 유지, 아니면 제거 OK
    events = [],
    setActiveEvent,
    startLoadingEvents,
    selectedCalendars = [],
  } = useCalendarStore();

  const [lastView, setLastView] = useState(
    localStorage.getItem("lastView") || "month"
  );

  // 이벤트 로딩
  useEffect(() => {
    startLoadingEvents();
  }, [startLoadingEvents]);

  const eventStyleGetter = (event) => {
  const bg = event?.color || "#A5B4FC";   // 기본 파스텔 보라
  return {
    style: {
      backgroundColor: bg,
      borderRadius: "8px",
      opacity: 0.95,
      color: "#111",
      border: "none",
      padding: "2px 6px",
      fontSize: "13px",
    },
  };
};

  // 화면 표시용 필터 (선택된 캘린더만)
  const filteredEvents = (events || []).filter((e) =>
    (selectedCalendars || []).includes(String(e.calendarId))
  );

  return (
    <>
      <Navbar />

      <div className="calendar-layout">
        <div className="sidebar-container">
          <CalendarSidebar />
        </div>

        <div className="calendar-main">
          <Calendar
            culture="ko"
            localizer={localizer}
            messages={messagesKO}
            events={filteredEvents}
            defaultView={lastView}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "calc(100vh - 80px)" }}
            eventPropGetter={eventStyleGetter}
            components={{ event: CalendarEvent }}
            selectable
            onSelectSlot={({ start, end }) => {
              if ((selectedCalendars || []).length === 0) {
                alert("캘린더를 먼저 선택하세요!");
                return;
              }
              setActiveEvent({
                title: "",
                notes: "",
                start,
                end,
                calendarId: String(selectedCalendars[0]),
              });
            }}
            onSelectEvent={(event) => setActiveEvent(event)}
            onView={(view) => {
              localStorage.setItem("lastView", view);
              setLastView(view);
            }}
          />
        </div>
      </div>

      <CalendarModal />
    </>
  );
};
