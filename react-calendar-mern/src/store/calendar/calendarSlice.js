// src/store/calendar/calendarSlice.js
import { createSlice } from '@reduxjs/toolkit';

export const calendarSlice = createSlice({
  name: 'calendar',
  initialState: {
    isLoadingEvents: true,
    events: [],
    activeEvent: null,

    // 캘린더 목록 & 선택된 캘린더
    calendars: [],           
    selectedCalendars: [],   
  },
  reducers: {
    onSetActiveEvent: (state, { payload }) => {
      state.activeEvent = payload;
    },
    onAddNewEvent: (state, { payload }) => {
      state.events.push(payload);
      state.activeEvent = null;
    },
    onUpdateEvent: (state, { payload }) => {
      state.events = state.events.map(event =>
        event.id === payload.id ? payload : event
      );
    },
    onDeleteEvent: (state) => {
      if (state.activeEvent) {
        state.events = state.events.filter(
          event => event.id !== state.activeEvent.id
        );
        state.activeEvent = null;
      }
    },
    onLoadEvents: (state, { payload = [] }) => {
      state.isLoadingEvents = false;
      payload.forEach(event => {
        const exists = state.events.some(dbEvent => dbEvent.id === event.id);
        if (!exists) {
          state.events.push(event);
        }
      });
    },
    onLogoutCalendar: (state) => {
      state.isLoadingEvents = true;
      state.events = [];
      state.activeEvent = null;
      state.calendars = [];
      state.selectedCalendars = [];
    },

    // 캘린더 목록 세팅
    onSetCalendars: (state, { payload }) => {
      state.calendars = payload;
      state.selectedCalendars = payload.map(c => c.id.toString());
    },

    // 체크박스 on/off
    onToggleCalendar: (state, { payload }) => {
      const id = payload.toString();
      if (state.selectedCalendars.includes(id)) {
        state.selectedCalendars = state.selectedCalendars.filter(cid => cid !== id);
      } else {
        state.selectedCalendars.push(id);
      }
    }
  }
});

export const { 
  onSetActiveEvent,
  onAddNewEvent, 
  onUpdateEvent, 
  onDeleteEvent,
  onLoadEvents,
  onLogoutCalendar,
  onSetCalendars,
  onToggleCalendar
} = calendarSlice.actions;
