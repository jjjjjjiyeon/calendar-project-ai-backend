const { response } = require('express');
const crypto = require("crypto");
const Calendar = require('../models/Calendar');
const Usuario = require('../models/Usuario');
const Evento = require('../models/Evento');
const { Types } = require('mongoose');

// 프론트(앱) 절대 경로 (공유 링크용). .env에 PUBLIC_APP_ORIGIN이 있으면 그걸 쓰고, 없으면 로컬 기본값.
const APP_ORIGIN = process.env.PUBLIC_APP_ORIGIN 
  || process.env.FRONTEND_URL 
  || 'http://localhost:5173'; 

/** 절대 링크 조립 (앱 라우팅: /invite/:token, API 라우팅: /api/calendars/join/:token 둘 다 반환) */
const buildShareLinks = (token) => ({
  appInviteUrl: `${APP_ORIGIN}/invite/${token}`,              // 프론트에서 이 라우트 만들면 클릭 → 로그인 후 조인 처리 가능
  apiJoinUrl: `/api/calendars/join/${token}`,                 // 직접 API 호출용
});

/** 안전한 토큰 생성 */
const newToken = () => crypto.randomBytes(16).toString('hex');

// 📌 내 캘린더 + 내가 멤버인 캘린더 조회
const getCalendars = async (req, res = response) => {
  try {
    const uid = req.uid;

    // ✅ members.user 로만 조회 (members: uid 금지)
    const calendars = await Calendar.find({
      $or: [{ owner: uid }, { 'members.user': uid }]
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email'); // ✅ subdoc일 때만 채워짐

    return res.json({ ok: true, calendars });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al obtener calendarios' });
  }
};


// 📌 새 캘린더 생성
const createCalendar = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, msg: 'name es requerido' });
    }

    const calendar = new Calendar({
      name: name.trim(),
      owner: uid,
      members: []
    });
    await calendar.save();

    return res.status(201).json({ ok: true, calendar });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al crear calendario' });
  }
};

// 📌 이름 변경
const renameCalendar = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { id } = req.params;
    const { name } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: 'No existe' });

    if (calendar.owner.toString() !== uid) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    calendar.name = name || calendar.name;
    await calendar.save();

    return res.json({ ok: true, calendar });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al renombrar' });
  }
};

// 📌 삭제
const deleteCalendar = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: 'No existe' });

    if (calendar.owner.toString() !== uid) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    // 해당 캘린더의 이벤트도 같이 삭제
    await Evento.deleteMany({ calendarId: id });
    await calendar.deleteOne();

    return res.json({ ok: true, msg: 'Eliminado' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al eliminar' });
  }
};

// 📌 멤버 추가(이메일)
const addMember = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { id } = req.params;
    const { email, role } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: 'No existe' });

    if (calendar.owner.toString() !== uid) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    const userToAdd = await Usuario.findOne({ email });
    if (!userToAdd) return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });

    if (!calendar.members.find(m => m.user.toString() === userToAdd._id.toString())) {
      calendar.members.push({ user: userToAdd._id, role: role || "viewer" });
      await calendar.save();
    }

    return res.json({ ok: true, calendar });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al agregar miembro' });
  }
};

// 📌 멤버 제거
const removeMember = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { id } = req.params;
    const { memberId } = req.body;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: 'No existe' });

    if (calendar.owner.toString() !== uid) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    calendar.members = calendar.members.filter(m => m.user.toString() !== memberId);
    await calendar.save();

    return res.json({ ok: true, calendar });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al remover miembro' });
  }
};

/* ======================= 공유/초대 링크 기능 ======================= */

// 📌 공유 링크 생성/조회(소유자만) — POST /calendars/:id/share?rotate=true
const generateShareLink = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { id } = req.params;
    const { rotate } = req.query; // rotate=true면 재발급

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: 'No existe' });

    if (calendar.owner.toString() !== uid) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    if (!calendar.shareToken || String(rotate) === 'true') {
      calendar.shareToken = crypto.randomBytes(16).toString("hex");
      await calendar.save();
    }

    // ✅ 여기서 링크를 직접 만듦 (buildShareLinks 제거)
    const appInviteUrl = `${APP_ORIGIN}/invite/${calendar.shareToken}`;
    const apiJoinUrl = `/api/calendars/join/${calendar.shareToken}`;

    return res.json({
      ok: true,
      token: calendar.shareToken,
      appInviteUrl,
      apiJoinUrl,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al generar link' });
  }
};

// 📌 공유 링크 폐기(소유자만) — DELETE /calendars/:id/share
const revokeShareLink = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: 'No existe' });

    if (calendar.owner.toString() !== uid) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    calendar.shareToken = null;
    await calendar.save();
    return res.json({ ok: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al revocar link' });
  }
};

// 📌 공유 정보 조회(소유자/멤버) — GET /calendars/:id/share
const getShareInfo = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { id } = req.params;

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok: false, msg: 'No existe' });

    const isOwner = calendar.owner.toString() === uid;
    const isMember = (calendar.members || []).some(m => m.user.toString() === uid);
    if (!isOwner && !isMember) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    const token = calendar.shareToken || null;
    const links = token ? buildShareLinks(token) : {};
    return res.json({ ok: true, token, ...links });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al obtener share info' });
  }
};

// controllers/calendars.js
const joinByToken = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { token } = req.params;

    const cal = await Calendar.findOne({ shareToken: token });
    if (!cal) return res.status(404).json({ ok:false, msg:'No existe' });

    if (cal.owner.toString() === uid) {
      return res.json({ ok:true, calendar: cal }); // 이미 소유자
    }

    const exists = cal.members.find(m => m.user.toString() === uid);
    if (!exists) {
      cal.members.push({ user: uid, role: "viewer" }); // 기본 viewer
      await cal.save();
    }
    return res.json({ ok:true, calendar: cal });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ ok:false, msg:'Error al unirse por link' });
  }
};


/* =============================================================== */

// 📌 캘린더 검색
const searchCalendars = async (req, res = response) => {
  try {
    const { keyword } = req.params;
    const calendars = await Calendar.find({ name: new RegExp(keyword, 'i') });
    return res.json({ ok: true, calendars });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, msg: 'Error al buscar' });
  }
};

const getCalendarMembers = async (req, res) => {
  try {
    const uid = req.uid;
    const { id } = req.params;

    // 캘린더 조회 (두 가지 멤버 구조 모두 대응)
    // 1) members: [ObjectId]
    // 2) members: [{ user: ObjectId, role: 'member' }]
    let calendar = await Calendar.findById(id)
      .populate('owner', 'name email')
      .populate('members', 'name email')       // case 1
      .populate('members.user', 'name email'); // case 2

    if (!calendar) {
      return res.status(404).json({ ok: false, msg: 'Calendar not found' });
    }

    // 접근 권한: 소유자거나 멤버여야 함
    const isOwner = calendar.owner && calendar.owner._id.toString() === uid;
    const isMember =
      Array.isArray(calendar.members) &&
      calendar.members.some(m =>
        // case 2: subdoc
        (m.user && m.user._id && m.user._id.toString() === uid) ||
        // case 1: ObjectId or populated user
        (m._id && m._id.toString && m._id.toString() === uid) ||
        // populated as Usuario (case 1)
        (m.id && m.id === uid)
      );

    if (!isOwner && !isMember) {
      return res.status(401).json({ ok: false, msg: 'No autorizado' });
    }

    // 응답용 멤버 배열 빌드
    const list = [];

    // owner 먼저 푸시
    if (calendar.owner) {
      list.push({
        _id: calendar.owner._id,
        name: calendar.owner.name,
        email: calendar.owner.email,
        role: 'owner',
      });
    }

    // members 푸시 (case1 / case2 모두 처리)
    (calendar.members || []).forEach((m) => {
      // case 2: { user: Usuario, role? }
      if (m && m.user) {
        list.push({
          _id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          role: m.role || 'member',
        });
      } else if (m && (m._id || m.id || m.name)) {
        // case 1: Usuario (populated) or ObjectId
        if (m.name) {
          // populated Usuario
          list.push({
            _id: m._id,
            name: m.name,
            email: m.email,
            role: 'member',
          });
        } else {
          // ObjectId만 있는 경우 → 사용자 정보 조회
          list.push({ _id: m._id || m, name: '', email: '', role: 'member' });
        }
      }
    });

    // ObjectId만 있던 멤버가 섞여 있으면 한 번에 사용자 정보 채우기
    const missingIds = list.filter(x => !x.name && x._id).map(x => x._id);
    if (missingIds.length > 0) {
      const users = await Usuario.find({ _id: { $in: missingIds } }, 'name email');
      const map = new Map(users.map(u => [u._id.toString(), u]));
      list.forEach(x => {
        if (!x.name && x._id) {
          const u = map.get(x._id.toString());
          if (u) { x.name = u.name; x.email = u.email; }
        }
      });
    }

    return res.json({ ok: true, members: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: 'Error al obtener miembros' });
  }
};

// 📌 멤버 권한 변경 (owner만) — PUT /calendars/:id/members/:memberId
const updateMemberRole = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { id, memberId } = req.params;
    const { role } = req.body; // 'viewer' | 'editor'

    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ ok:false, msg:'invalid role' });
    }

    const calendar = await Calendar.findById(id);
    if (!calendar) return res.status(404).json({ ok:false, msg:'No existe' });

    // 오너만 권한 변경 가능
    if (calendar.owner.toString() !== uid) {
      return res.status(401).json({ ok:false, msg:'No autorizado' });
    }

    const toObjId = (v) => (Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : v);
    let changed = false;

    // ✅ members 를 모두 "서브도큐먼트 { user, role }" 형태로 정규화하면서 목표 멤버의 role을 변경
    const normalized = (calendar.members || []).map((m) => {
      // case A) 이미 서브도큐먼트 { user, role }
      if (m && m.user) {
        if (String(m.user) === String(memberId)) {
          m.role = role;
          changed = true;
        }
        return m;
      }

      // case B) ObjectId/String 으로만 존재 (옛 데이터)
      const rawId = String(m?._id || m);
      if (rawId === String(memberId)) {
        changed = true;
        return { user: toObjId(rawId), role };       // <-- 권한 부여
      }
      // 다른 멤버들도 정규화
      return { user: toObjId(rawId), role: 'viewer' };
    });

    // 혹시 멤버가 ObjectId 배열에 없었고(= 초대 안 된 사용자라면) 404 반환
    if (!changed) {
      return res.status(404).json({ ok:false, msg:'member not found' });
    }

    calendar.members = normalized;
    await calendar.save();

    return res.json({ ok:true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, msg:'Error al cambiar rol' });
  }
};

// 참여자 본인이 멤버에서 빠지는 API (소유자는 불가)
const leaveCalendar = async (req, res = response) => {
  try {
    const uid = req.uid;
    const { id } = req.params;

    const cal = await Calendar.findById(id);
    if (!cal) return res.status(404).json({ ok:false, msg:'No existe' });

    // 소유자는 나가기 불가
    if (String(cal.owner) === String(uid)) {
      return res.status(400).json({
        ok:false,
        msg:'El propietario no puede salir. Transfiere la propiedad primero.'
      });
    }

    const before = (cal.members || []).length;
    cal.members = (cal.members || []).filter(m => {
      // members 가 ObjectId 배열이거나 {user, role} 서브도큐먼트 모두 지원
      const mid = m && (m.user ? String(m.user) : String(m._id || m));
      return mid !== String(uid);
    });

    if (cal.members.length === before) {
      return res.json({ ok:true, msg:'No-op', calendar: cal });
    }

    await cal.save();
    return res.json({ ok:true, calendar: cal });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, msg:'Error al salir del calendario' });
  }
};


module.exports = {
  getCalendars,
  createCalendar,
  renameCalendar,
  deleteCalendar,
  addMember,
  removeMember,

  // 공유/초대 관련
  generateShareLink,
  revokeShareLink,
  getShareInfo,
  joinByToken,

  searchCalendars,
  getCalendarMembers,
  updateMemberRole,

  leaveCalendar,
};
