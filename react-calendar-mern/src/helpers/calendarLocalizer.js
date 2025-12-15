// src/helpers/calendarLocalizer.js
import { dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
} from "date-fns";
import { ko } from "date-fns/locale";

const locales = { ko };

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 0 }),
  getDay,
  locales,
});

export const messagesKO = {
  allDay: "하루 종일",
  previous: "이전",
  next: "다음",
  today: "오늘",
  month: "월",
  week: "주",
  day: "일",
  agenda: "의제",
  date: "날짜",
  time: "시간",
  event: "일정",
  noEventsInRange: "이 기간에는 일정이 없습니다.",
  showMore: (count) => `+${count} 더보기`,
};
