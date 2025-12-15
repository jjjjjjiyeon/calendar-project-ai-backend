// controllers/events.js
const { response } = require('express');
const Evento = require('../models/Evento');
const Calendar = require('../models/Calendar');

const DEFAULT_COLOR = '#A5B4FC';

// 허용필드만 집어넣기
const pickAllowed = (body) => ({
  title: body.title,
  notes: body.notes,
  start: body.start,
  end: body.end,
  calendarId: body.calendarId,
  color: body.color || DEFAULT_COLOR,
});

/** members 스키마가
 *  1) [ObjectId] 이거나
 *  2) [{ user: ObjectId, role: 'viewer'|'editor'|'owner' }]
 *  두 경우 모두 지원하는 헬퍼들
 */
const isMemberUserId = (m) => {
  if (!m) return null;
  if (m.user) return String(m.user);           // subdoc { user, role }
  if (m._id) return String(m._id);             // populated Usuario
  return String(m);                             // ObjectId or string
};

const getRole = (uid, cal) => {
  if (!cal) return null;
  if (cal.owner && String(cal.owner) === uid) return 'owner';
  const mm = (cal.members || []).find((m) => isMemberUserId(m) === uid);
  return mm ? (mm.role || 'viewer') : null;
};

const canViewCalendar = (uid, cal) => !!getRole(uid, cal);
const canEditCalendar = (uid, cal) => {
  const r = getRole(uid, cal);
  return r === 'owner' || r === 'editor';
};

// 내가 접근 가능한(소유자 or 멤버) 캘린더의 이벤트만 조회
const getEventos = async (req, res = response) => {
  try {
    const uid = req.uid;

    // ✅ 허용 캘린더 수집: members.user 로만 조회
    const myCalendars = await Calendar.find(
      { $or: [{ owner: uid }, { 'members.user': uid }] },
      '_id'
    );
    const allowedIds = myCalendars.map((c) => String(c._id));

    const { calendarId } = req.query;
    let filter;
    if (calendarId) {
      const idStr = String(calendarId);
      if (!allowedIds.includes(idStr)) {
        return res.status(403).json({ ok: false, msg: 'No autorizado para este calendario' });
      }
      filter = { calendarId: idStr };
    } else {
      filter = { calendarId: { $in: allowedIds } };
    }

    const eventos = await Evento.find(filter)
      .populate('user', 'name email')
      .populate('calendarId', 'name owner');

    return res.json({ ok: true, eventos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
  }
};


// 이벤트 생성 (owner/editor만)
const crearEvento = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { calendarId } = req.body;
    if (!calendarId)
      return res.status(400).json({ ok: false, msg: 'calendarId es requerido' });

    const cal = await Calendar.findById(calendarId);
    if (!cal) return res.status(404).json({ ok: false, msg: 'Calendar no existe' });

    if (!canEditCalendar(uid, cal)) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    const allowed = pickAllowed(req.body);
    const evento = new Evento({ ...allowed, user: uid });

    const eventoGuardado = await evento.save();
    return res.status(201).json({ ok: true, evento: eventoGuardado });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
  }
};

// 이벤트 수정: (작성자 본인) OR (owner/editor)
// calendarId를 바꾸는 경우 타깃 캘린더도 편집권 필요
const actualizarEvento = async (req, res = response) => {
  try {
    const uid = req.uid;
    const eventoId = req.params.id;

    const existente = await Evento.findById(eventoId);
    if (!existente)
      return res.status(404).json({ ok: false, msg: 'Evento no existe' });

    const calActual = await Calendar.findById(existente.calendarId);
    if (!calActual)
      return res.status(404).json({ ok: false, msg: 'Calendar no existe' });

    const isOwnerOfEvent = String(existente.user) === String(uid);
    const canEdit = isOwnerOfEvent || canEditCalendar(uid, calActual);
    if (!canEdit) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    const payload = pickAllowed(req.body);
    if (payload.calendarId && String(payload.calendarId) !== String(existente.calendarId)) {
      const calTarget = await Calendar.findById(payload.calendarId);
      if (!calTarget) {
        return res.status(404).json({ ok: false, msg: 'Nuevo calendario no existe' });
      }
      if (!canEditCalendar(uid, calTarget)) {
        return res.status(401).json({ ok: false, msg: 'No autorizado para mover a ese calendario' });
      }
    }

    const eventoActualizado = await Evento.findByIdAndUpdate(
      eventoId,
      { ...payload, user: existente.user }, // 작성자 유지
      { new: true }
    );

    return res.json({ ok: true, evento: eventoActualizado });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
  }
};

// 이벤트 삭제: (작성자 본인) OR (owner/editor)
const eliminarEvento = async (req, res = response) => {
  try {
    const uid = req.uid;
    const eventoId = req.params.id;

    const existente = await Evento.findById(eventoId);
    if (!existente)
      return res.status(404).json({ ok: false, msg: 'Evento no existe' });

    const cal = await Calendar.findById(existente.calendarId);
    if (!cal)
      return res.status(404).json({ ok: false, msg: 'Calendar no existe' });

    const isOwnerOfEvent = String(existente.user) === String(uid);
    const canDel = isOwnerOfEvent || canEditCalendar(uid, cal);
    if (!canDel) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    await Evento.findByIdAndDelete(eventoId);
    return res.json({ ok: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Hable con el administrador' });
  }
};

module.exports = {
  getEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
};
