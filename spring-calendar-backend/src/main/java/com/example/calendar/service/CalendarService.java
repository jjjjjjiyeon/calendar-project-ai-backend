package com.example.calendar.service;

import com.example.calendar.entity.Calendar;
import com.example.calendar.entity.Evento;
import com.example.calendar.entity.Member;
import com.example.calendar.entity.Usuario;
import com.example.calendar.repository.CalendarRepository;
import com.example.calendar.repository.EventoRepository;
import com.example.calendar.repository.UsuarioRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.Optional;


@Service
public class CalendarService {

    @Autowired
    private CalendarRepository calendarRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private EventoRepository eventoRepo;

    private final SecureRandom random = new SecureRandom();

    // 🔥 Node.js crypto.randomBytes(16).toString("hex") 동일
    private String generateHexToken() {
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);

        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /* ==========================================================
       1) 내 캘린더 조회 (owner + member)
       ========================================================== */
    public Map<String, Object> getUserCalendars(String uid) {
        try {
            // 1. 현재 사용자가 속한 캘린더 목록을 필터링합니다. (기존 코드와 동일)
            List<Calendar> rawCalendars = calendarRepo.findAll().stream()
                    .filter(c -> Objects.equals(c.getOwner(), uid)
                            || c.getMembers().stream()
                            .anyMatch(m -> Objects.equals(m.getUser(), uid)))
                    .collect(Collectors.toList());

            // 2. 각 캘린더 객체에 'role' 정보를 추가하여 새로운 리스트(Map 형태)로 변환합니다.
            List<Map<String, Object>> calendarsWithRole = rawCalendars.stream()
                    .map(cal -> {
                        String role = "";
                        
                        // 🔥 1. 현재 사용자가 OWNER인지 확인
                        if (Objects.equals(cal.getOwner(), uid)) {
                            role = "owner";
                        } else {
                            // 2. 멤버 목록에서 사용자 ID와 일치하는 멤버의 role을 찾음
                            Optional<Member> member = cal.getMembers().stream()
                                    .filter(m -> Objects.equals(m.getUser(), uid))
                                    .findFirst();
                            
                            // 3. 멤버 role 설정 (못 찾으면 기본값 "viewer"나 빈 문자열 사용 가능)
                            role = member.map(Member::getRole).orElse("viewer");
                        }

                        // Calendar 객체와 role을 포함하는 새로운 Map 생성
                        Map<String, Object> calMap = new HashMap<>();
                        
                        // Calendar 객체의 모든 필드를 calMap에 복사 (여기에 getter를 사용한다고 가정)
                        calMap.put("id", cal.getId());
                        calMap.put("name", cal.getName());
                        calMap.put("owner", cal.getOwner());
                        calMap.put("shareToken", cal.getShareToken()); // shareToken도 포함
                        calMap.put("members", cal.getMembers()); // members 리스트도 포함

                        // 🔥 필수! role 필드를 추가
                        calMap.put("role", role); 

                        return calMap;
                    })
                    .collect(Collectors.toList());

            return Map.of(
                    "ok", true,
                    // 🔥 변환된 리스트를 반환
                    "calendars", calendarsWithRole 
            );
        } catch (Exception e) {
            System.err.println("Error al obtener calendarios: " + e.getMessage());
            return Map.of("ok", false, "msg", "Error al obtener calendarios");
        }
    }

    /* ==========================================================
       2) 캘린더 생성
       ========================================================== */
    public Map<String, Object> createCalendar(String uid, String name) {
        try {
            Calendar cal = new Calendar();
            cal.setName(name);
            cal.setOwner(uid);
            cal.setMembers(new ArrayList<>());

            calendarRepo.save(cal);

            return Map.of(
                    "ok", true,
                    "calendar", cal
            );
        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al crear calendario");
        }
    }

    /* ==========================================================
       3) 이름 변경
       ========================================================== */
    public Map<String, Object> renameCalendar(String uid, String id, String name) {
        try {
            Calendar cal = calendarRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            if (!Objects.equals(cal.getOwner(), uid)) {
                return Map.of("ok", false, "msg", "No autorizado");
            }

            cal.setName(name);
            calendarRepo.save(cal);

            return Map.of("ok", true, "calendar", cal);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al renombrar");
        }
    }

    /* ==========================================================
       4) 캘린더 삭제
       ========================================================== */
    public Map<String, Object> deleteCalendar(String uid, String id) {
        try {
            Calendar cal = calendarRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            if (!Objects.equals(cal.getOwner(), uid)) {
                return Map.of("ok", false, "msg", "No autorizado");
            }

            eventoRepo.deleteByCalendarId(id);
            calendarRepo.deleteById(id);

            return Map.of("ok", true, "msg", "Eliminado");

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al eliminar");
        }
    }

    /* ==========================================================
       5) 멤버 추가
       ========================================================== */
    public Map<String, Object> addMember(String uid, String calendarId, String email, String role) {
        try {
            Calendar cal = calendarRepo.findById(calendarId)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            if (!Objects.equals(cal.getOwner(), uid)) {
                return Map.of("ok", false, "msg", "No autorizado");
            }

            Usuario user = usuarioRepo.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            boolean exists = cal.getMembers().stream()
                    .anyMatch(m -> Objects.equals(m.getUser(), user.getId()));

            if (!exists) {
                cal.getMembers().add(new Member(user.getId(), role == null ? "viewer" : role));
                calendarRepo.save(cal);
            }

            return Map.of("ok", true, "calendar", cal);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al agregar miembro");
        }
    }

    /* ==========================================================
       6) 멤버 삭제
       ========================================================== */
    public Map<String, Object> removeMember(String uid, String calendarId, String memberId) {
        try {
            Calendar cal = calendarRepo.findById(calendarId)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            if (!Objects.equals(cal.getOwner(), uid)) {
                return Map.of("ok", false, "msg", "No autorizado");
            }

            cal.setMembers(
                    cal.getMembers().stream()
                            .filter(m -> !Objects.equals(m.getUser(), memberId))
                            .collect(Collectors.toList())
            );

            calendarRepo.save(cal);

            return Map.of("ok", true, "calendar", cal);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al remover miembro");
        }
    }

    /* ==========================================================
       7) 멤버 목록 조회
       ========================================================== */
    public Map<String, Object> getCalendarMembers(String uid, String calendarId) {
        try {
            Calendar cal = calendarRepo.findById(calendarId)
                    .orElseThrow(() -> new RuntimeException("Calendar not found"));

            boolean isOwner = Objects.equals(cal.getOwner(), uid);
            boolean isMember = cal.getMembers().stream()
                    .anyMatch(m -> Objects.equals(m.getUser(), uid));

            if (!isOwner && !isMember) {
                return Map.of("ok", false, "msg", "No autorizado");
            }

            List<Map<String, Object>> members = new ArrayList<>();

            // owner
            usuarioRepo.findById(cal.getOwner()).ifPresent(u ->
                    members.add(Map.of(
                            "_id", u.getId(),
                            "name", u.getName(),
                            "email", u.getEmail(),
                            "role", "owner"
                    ))
            );

            // members
            for (Member m : cal.getMembers()) {
                usuarioRepo.findById(m.getUser()).ifPresent(u ->
                        members.add(Map.of(
                                "_id", u.getId(),
                                "name", u.getName(),
                                "email", u.getEmail(),
                                "role", m.getRole()
                        ))
                );
            }

            return Map.of("ok", true, "members", members);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al obtener miembros");
        }
    }

    /* ==========================================================
       8) 멤버 권한 변경
       ========================================================== */
    public Map<String, Object> updateMemberRole(String uid, String calendarId, String memberId, String role) {
        try {

            Calendar cal = calendarRepo.findById(calendarId)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            if (!Objects.equals(cal.getOwner(), uid)) {
                return Map.of("ok", false, "msg", "No autorizado");
            }

            boolean found = false;

            for (Member m : cal.getMembers()) {
                if (Objects.equals(m.getUser(), memberId)) {
                    m.setRole(role);
                    found = true;
                }
            }

            if (!found) {
                return Map.of("ok", false, "msg", "member not found");
            }

            calendarRepo.save(cal);

            return Map.of("ok", true);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al cambiar rol");
        }
    }

    /* ==========================================================
       9) 검색
       ========================================================== */
    public Map<String, Object> searchCalendars(String keyword) {
        try {
            List<Calendar> list = calendarRepo.findAll().stream()
                    .filter(c -> c.getName().toLowerCase().contains(keyword.toLowerCase()))
                    .collect(Collectors.toList());

            return Map.of("ok", true, "calendars", list);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al buscar");
        }
    }

    /* ==========================================================
       10) 공유 링크 생성
       ========================================================== */
    public Map<String, Object> generateShareLink(String uid, String id, boolean rotate) {
        try {
            Calendar cal = calendarRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            if (!Objects.equals(cal.getOwner(), uid)) {
                return Map.of("ok", false, "msg", "No autorizado");
            }

            if (rotate || cal.getShareToken() == null) {
                cal.setShareToken(generateHexToken());
                calendarRepo.save(cal);
            }

            return Map.of(
                    "ok", true,
                    "token", cal.getShareToken(),
                    "appInviteUrl", "http://localhost:3000/invite/" + cal.getShareToken(),
                    "apiJoinUrl", "/api/calendars/join/" + cal.getShareToken()
            );

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al generar link");
        }
    }

    /* ==========================================================
       11) 공유 링크 조회
       ========================================================== */
    public Map<String, Object> getShareInfo(String uid, String id) {
        try {
            Calendar cal = calendarRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            boolean isOwner = Objects.equals(cal.getOwner(), uid);
            boolean isMember = cal.getMembers().stream().anyMatch(m -> Objects.equals(m.getUser(), uid));

            if (!isOwner && !isMember) {
                return Map.of("ok", false, "msg", "No autorizado");
            }

            if (cal.getShareToken() == null) {
                return Map.of("ok", true, "token", null);
            }

            return Map.of(
                    "ok", true,
                    "token", cal.getShareToken(),
                    "appInviteUrl", "http://localhost:3000/invite/" + cal.getShareToken(),
                    "apiJoinUrl", "/api/calendars/join/" + cal.getShareToken()
            );

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al obtener share info");
        }
    }

    /* ==========================================================
       12) 공유 링크 삭제
       ========================================================== */
    public Map<String, Object> revokeShareLink(String uid, String id) {
        try {
            Calendar cal = calendarRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            if (!Objects.equals(cal.getOwner(), uid)) {
                return Map.of("ok", false, "msg", "No autorizado");
            }

            cal.setShareToken(null);
            calendarRepo.save(cal);

            return Map.of("ok", true);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al revocar link");
        }
    }

    /* ==========================================================
       13) 토큰으로 참가
       ========================================================== */
    public Map<String, Object> joinByToken(String uid, String token) {
        try {
            Calendar cal = calendarRepo.findByShareToken(token)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            if (Objects.equals(cal.getOwner(), uid)) {
                return Map.of("ok", true, "calendar", cal);
            }

            boolean exists = cal.getMembers().stream()
                    .anyMatch(m -> Objects.equals(m.getUser(), uid));

            if (!exists) {
                cal.getMembers().add(new Member(uid, "viewer"));
                calendarRepo.save(cal);
            }

            return Map.of("ok", true, "calendar", cal);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al unirse por link");
        }
    }

    /* ==========================================================
       14) 본인이 캘린더 나가기
       ========================================================== */
    public Map<String, Object> leaveCalendar(String uid, String id) {
        try {
            Calendar cal = calendarRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("No existe"));

            if (Objects.equals(cal.getOwner(), uid)) {
                return Map.of("ok", false, "msg", "El propietario no puede salir. Transfiere la propiedad primero.");
            }

            int before = cal.getMembers().size();

            cal.setMembers(
                    cal.getMembers().stream()
                            .filter(m -> !Objects.equals(m.getUser(), uid))
                            .collect(Collectors.toList())
            );

            calendarRepo.save(cal);

            return Map.of("ok", true, "calendar", cal);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Error al salir del calendario");
        }
    }

    /* ==========================================================
   15) AI: 일정 추가
   ========================================================== */
public Map<String, Object> addEvent(
        String uid, String title, String details,
        LocalDateTime dateTime, String calendarId
) {
    try {
        Calendar cal = calendarRepo.findById(calendarId)
                .orElseThrow(() -> new RuntimeException("Calendar not found"));

        boolean isOwner = Objects.equals(cal.getOwner(), uid);
        boolean isMember = cal.getMembers().stream()
                .anyMatch(m -> Objects.equals(m.getUser(), uid));

        if (!isOwner && !isMember) {
            return Map.of("ok", false, "msg", "권한이 없습니다.");
        }

        Evento ev = new Evento();
        ev.setTitle(title == null ? "" : title);
        ev.setNotes(details == null ? "" : details);

        // ✅ 이거 추가 (가장 중요)
        ev.setUser(uid);

        ev.setStart(dateTime);
        ev.setEnd(dateTime.plusHours(1));
        ev.setCalendarId(calendarId);

        eventoRepo.save(ev);

        return Map.of("ok", true, "event", ev);

    } catch (Exception e) {
        e.printStackTrace(); // ✅ 원인 로그 보려고 (추천)
        return Map.of("ok", false, "msg", "일정 생성 오류");
    }
}


/* ==========================================================
   16) AI: 일정 수정
   ========================================================== */
public Map<String, Object> updateEvent(
        String uid, String title, String details,
        LocalDateTime dateTime, String calendarId
) {
    try {
        // 제목 일치 & 시작시간 일치하는 일정 찾기
        Optional<Evento> opt = eventoRepo.findByTitleAndStart(title, dateTime);

        if (opt.isEmpty()) {
            return Map.of("ok", false, "msg", "수정할 일정이 없습니다.");
        }

        Evento ev = opt.get();

        ev.setTitle(title);
        ev.setNotes(details);
        ev.setStart(dateTime);
        ev.setEnd(dateTime.plusHours(1));

        eventoRepo.save(ev);

        return Map.of("ok", true, "event", ev);

    } catch (Exception e) {
        return Map.of("ok", false, "msg", "일정 수정 오류");
    }
}

/* ==========================================================
   17) AI: 일정 삭제
   ========================================================== */
public Map<String, Object> deleteEvent(
        String uid, String title,
        LocalDateTime dateTime, String calendarId
) {
    try {
        Optional<Evento> opt = eventoRepo.findByTitleAndStart(title, dateTime);

        if (opt.isEmpty()) {
            return Map.of("ok", false, "msg", "삭제할 일정이 없습니다.");
        }

        eventoRepo.delete(opt.get());
        return Map.of("ok", true, "msg", "삭제 완료");

    } catch (Exception e) {
        return Map.of("ok", false, "msg", "삭제 중 오류");
    }
}

/* ==========================================================
   18) AI: 간단 추천 기능
   ========================================================== */
public Map<String, Object> recommendSchedule(String uid) {
    return Map.of(
            "ok", true,
            "msg", "사용자의 빈 시간대는 오후 3시 ~ 5시입니다. 이 시간에 회의 어떨까요?"
    );
}
public String getDefaultCalendar(String uid) {
    // 사용자가 가진 캘린더 중 첫 번째 반환
    List<Calendar> list = calendarRepo.findAll().stream()
            .filter(c -> Objects.equals(c.getOwner(), uid)
                    || c.getMembers().stream().anyMatch(m -> Objects.equals(m.getUser(), uid)))
            .collect(Collectors.toList());

    if (list.isEmpty()) {
        throw new RuntimeException("사용자에게 캘린더가 없습니다.");
    }

    return list.get(0).getId();
}

// 15) AI: 매주 반복 일정 추가
public Map<String, Object> addWeeklyEvents(
        String uid,
        String title,
        String details,
        LocalDateTime firstDateTime,
        String calendarId,
        int repeatCount
) {
    try {
        // 캘린더 존재/권한 확인은 addEvent와 비슷하게
        Calendar cal = calendarRepo.findById(calendarId)
                .orElseThrow(() -> new RuntimeException("Calendar not found"));

        boolean isOwner = Objects.equals(cal.getOwner(), uid);
        boolean isMember = cal.getMembers().stream()
                .anyMatch(m -> Objects.equals(m.getUser(), uid));

        if (!isOwner && !isMember) {
            return Map.of("ok", false, "msg", "권한이 없습니다.");
        }

        List<Evento> created = new ArrayList<>();

        for (int i = 0; i < repeatCount; i++) {
            LocalDateTime dt = firstDateTime.plusWeeks(i);

            Evento ev = new Evento();
            ev.setTitle(title == null ? "" : title);
            ev.setNotes(details == null ? "" : details);
            ev.setStart(dt);
            ev.setEnd(dt.plusHours(1));
            ev.setCalendarId(calendarId);
            ev.setUser(uid);

            eventoRepo.save(ev);
            created.add(ev);
        }

        return Map.of("ok", true, "events", created);

    } catch (Exception e) {
        return Map.of("ok", false, "msg", "반복 일정 생성 오류");
    }
}



}
