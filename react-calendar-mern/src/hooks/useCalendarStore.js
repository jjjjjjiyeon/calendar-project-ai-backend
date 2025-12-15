// src/hooks/useCalendarStore.js
import { create } from "zustand";
import calendarApi from "../api/calendarApi";

const SELECTED_KEY = "selectedCalendars";
const DEFAULT_COLOR = "#A5B4FC";

// ID 정규화
const normalizeCalId = (v) =>
  v && typeof v === "object" ? String(v._id || v.id) : String(v || "");

// ✅ UTC ISO 문자열로 변환 (시간대 보정)
const toUtcISOString = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

export const useCalendarStore = create((set, get) => ({

  events: [],
  activeEvent: null,
  calendars: [],
  selectedCalendars: [],

  /* ==========================================================
     1) 캘린더 목록 불러오기
  ========================================================== */
  startLoadingCalendars: async () => {
    try {
      const { data } = await calendarApi.get("/calendars");

      const calendars = (data?.calendars || []).map((c) => ({
        id: String(c._id || c.id),
        name: c.name,
        role: c.role,
        ownerId: String(c.owner),
        type: c.role === "owner" ? "my" : "shared",
      }));

      const saved = JSON.parse(localStorage.getItem(SELECTED_KEY) || "[]");

      const selected =
        Array.isArray(saved) && saved.length > 0
          ? saved.filter((id) => calendars.some((c) => c.id === id))
          : calendars.map((c) => c.id);

      set({ calendars, selectedCalendars: selected });
      localStorage.setItem(SELECTED_KEY, JSON.stringify(selected));
    } catch (err) {
      console.error("캘린더 불러오기 오류:", err);
      set({ calendars: [], selectedCalendars: [] });
      localStorage.setItem(SELECTED_KEY, JSON.stringify([]));
    }
  },

  /* ==========================================================
     2) 이벤트 불러오기
  ========================================================== */
  startLoadingEvents: async () => {
    try {
      const { data } = await calendarApi.get("/events");

      const events = (data?.eventos || []).map((e) => ({
        ...e,
        id: String(e._id || e.id),
        start: new Date(e.start),
        end: new Date(e.end),
        calendarId: normalizeCalId(e.calendarId),
        color: e.color || DEFAULT_COLOR,
      }));

      set({ events });
    } catch (err) {
      console.error("이벤트 불러오기 오류:", err);
      set({ events: [] });
    }
  },

  /* ==========================================================
     3) 이벤트 저장
  ========================================================== */
  startSavingEvent: async (event) => {
    try {
      const selected = get().selectedCalendars || [];

      const payload = {
        ...event,
        calendarId: normalizeCalId(event.calendarId || selected[0] || ""),
        color: event.color || DEFAULT_COLOR,
        start: toUtcISOString(new Date(event.start)),
        end: toUtcISOString(new Date(event.end)),
      };

      // ===== 수정 =====
      if (payload._id || payload.id) {
        const id = String(payload._id || payload.id);

        const { data } = await calendarApi.put(`/events/${id}`, payload);
        if (!data.ok) throw new Error(data.msg);

        const saved = data.evento;
        const calId = normalizeCalId(saved.calendarId);

        set({
          events: get().events.map((e) =>
            String(e._id || e.id) === id
              ? {
                  ...e,
                  ...saved,
                  id: String(saved._id || saved.id || id),
                  start: new Date(saved.start),
                  end: new Date(saved.end),
                  calendarId: calId,
                  color: saved.color || payload.color || DEFAULT_COLOR,
                }
              : e
          ),
        });
        return;
      }

      // ===== 추가 =====
      const { data } = await calendarApi.post("/events", payload);
      if (!data.ok) throw new Error(data.msg);

      const saved = data.evento;
      const calId = normalizeCalId(saved.calendarId);

      set({
        events: [
          ...get().events,
          {
            ...saved,
            id: String(saved._id || saved.id),
            start: new Date(saved.start),
            end: new Date(saved.end),
            calendarId: calId,
            color: saved.color || payload.color || DEFAULT_COLOR,
          },
        ],
      });
    } catch (err) {
      console.error("이벤트 저장 실패:", err);
      throw err;
    }
  },

  /* ==========================================================
     4) 이벤트 삭제
  ========================================================== */
  startDeletingEvent: async () => {
    const { activeEvent, events } = get();
    if (!activeEvent) return;

    const id = String(activeEvent._id || activeEvent.id);
    try {
      const { data } = await calendarApi.delete(`/events/${id}`);

      if (!data.ok) throw new Error(data.msg);

      set({
        events: events.filter((e) => String(e._id || e.id) !== id),
        activeEvent: null,
      });
    } catch (err) {
      console.error("이벤트 삭제 실패:", err);
      throw err;
    }
  },

  /* ==========================================================
     5) activeEvent
  ========================================================== */
  setActiveEvent: (event) => set({ activeEvent: event }),
  clearActiveEvent: () => set({ activeEvent: null }),

  /* ==========================================================
     6) 캘린더 체크 토글
  ========================================================== */
  toggleCalendar: (id) => {
    const sid = String(id);
    const { selectedCalendars } = get();

    const next = selectedCalendars.includes(sid)
      ? selectedCalendars.filter((x) => x !== sid)
      : [...selectedCalendars, sid];

    set({ selectedCalendars: next });
    localStorage.setItem(SELECTED_KEY, JSON.stringify(next));
  },

  /* ==========================================================
     7) 캘린더 나가기
  ========================================================== */
  leaveCalendar: async (calendarId) => {
    try {
      const { data } = await calendarApi.delete(`/calendars/${calendarId}/leave`);

      if (data.ok) {
        const next = get().calendars.filter((c) => c.id !== calendarId);
        set({ calendars: next });
        return true;
      }
      return false;
    } catch (err) {
      console.error("캘린더 나가기 실패:", err);
      return false;
    }
  },

}));
