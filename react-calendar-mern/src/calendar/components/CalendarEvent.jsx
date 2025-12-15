// src/calendar/components/CalendarEvent.jsx
export const CalendarEvent = ({ event }) => {
  return (
    <span title={event?.notes || ""}>
      {event?.title || "(제목 없음)"}
    </span>
  );
};
