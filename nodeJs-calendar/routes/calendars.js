/*
  /api/calendars
*/
const { Router } = require('express');
const { check } = require('express-validator');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validarCampos } = require('../middlewares/validar-campos');

const {
  getCalendars,
  createCalendar,
  renameCalendar,
  deleteCalendar,
  addMember,
  removeMember,
  generateShareLink,
  joinByToken,
  revokeShareLink, 
  getShareInfo, 
  getCalendarMembers, 
  updateMemberRole,  
  searchCalendars,
  leaveCalendar,
} = require('../controllers/calendars');

const router = Router();
router.use(validarJWT);

// 📌 기본
router.get('/', getCalendars);

router.post('/',
  [ check('name','name es requerido').not().isEmpty(), validarCampos ],
  createCalendar
);

router.put('/:id',
  [ check('name','name es requerido').not().isEmpty(), validarCampos ],
  renameCalendar
);

router.delete('/:id', deleteCalendar);

// 📌 멤버 추가/삭제
router.post('/:id/members',
  [ check('email','email es requerido').isEmail(), validarCampos ],
  addMember
);

router.delete('/:id/members',
  [ check('memberId','memberId requerido').not().isEmpty(), validarCampos ],
  removeMember
);

router.get('/:id/members', getCalendarMembers);

// 📌 공유 링크
router.get('/:id/share', getShareInfo);      // ✅ 현재 토큰/링크 조회
router.post('/:id/share', generateShareLink); // ✅ 생성(rotate는 ?rotate=true)
router.delete('/:id/share', revokeShareLink); // ✅ 폐기
router.post('/join/:token', joinByToken);     // ✅ 토큰으로 조인

// 📌 검색
router.get('/search/:keyword', searchCalendars);

// 권한 변경 (owner만): viewer <-> editor
router.put('/:id/members/:memberId', updateMemberRole);

// 참여자 본인이 나가기
router.delete('/:id/leave', leaveCalendar);

module.exports = router;
