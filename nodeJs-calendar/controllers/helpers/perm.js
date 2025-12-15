const Calendar = require("../../models/Calendar");

// 캘린더 접근(보기) 가능? = owner 또는 멤버
async function canViewCalendar(uid, calendarId) {
  const cal = await Calendar.findById(calendarId);
  if (!cal) return { ok:false };
  if (cal.owner.toString() === uid) return { ok:true, role:"owner", cal };
  const m = cal.members.find(x => x.user.toString() === uid);
  if (m) return { ok:true, role:m.role, cal };
  return { ok:false, cal };
}

// 편집/삭제 가능? = owner 또는 editor
async function canEditCalendar(uid, calendarId) {
  const r = await canViewCalendar(uid, calendarId);
  if (!r.ok) return r;
  if (r.role === "owner" || r.role === "editor") return { ...r, ok:true };
  return { ...r, ok:false };
}

module.exports = { canViewCalendar, canEditCalendar };
