import { create } from "zustand";
import calendarApi from "../api/calendarApi";

export const useEventStore = create((set, get) => ({
  events: [],
  activeEvent: null,

  // 일정 로드
  startLoadingEvents: async () => {
    try {
      const { data } = await calendarApi.get("/events");
      set({ events: data.eventos });
    } catch (error) {
      console.error("이벤트 불러오기 실패", error);
    }
  },

  // 새 일정 저장 (추가 & 수정)
  startSavingEvent: async (eventData) => {
    try {
      let savedEvent;

      if (eventData.id) {
        // 수정
        const { data } = await calendarApi.put(`/events/${eventData.id}`, eventData);
        savedEvent = data.evento;
        set((state) => ({
          events: state.events.map((evt) =>
            evt.id === savedEvent.id ? savedEvent : evt
          ),
        }));
      } else {
        // 추가
        const { data } = await calendarApi.post("/events", eventData);
        savedEvent = data.evento;
        set((state) => ({
          events: [...state.events, savedEvent],
        }));
      }
    } catch (error) {
      console.error("이벤트 저장 실패", error);
      throw error; // 프론트에서 Swal 띄우게
    }
  },

  // 일정 삭제
  startDeletingEvent: async () => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      await calendarApi.delete(`/events/${activeEvent.id}`);
      set((state) => ({
        events: state.events.filter((evt) => evt.id !== activeEvent.id),
        activeEvent: null,
      }));
    } catch (error) {
      console.error("이벤트 삭제 실패", error);
    }
  },

  // 현재 선택된 일정
  setActiveEvent: (event) => set({ activeEvent: event }),
  clearActiveEvent: () => set({ activeEvent: null }),
}));
