package com.example.calendar.controller;

import com.example.calendar.service.CalendarService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;

@RestController
@RequestMapping("/api/calendars")
public class CalendarController {

    @Autowired
    private CalendarService service;

    @GetMapping
    public ResponseEntity<?> getUserCalendars(HttpServletRequest req) {
        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.getUserCalendars(uid));
    }

    @PostMapping
    public ResponseEntity<?> createCalendar(HttpServletRequest req,
                                            @RequestBody Map<String, String> body) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.createCalendar(uid, body.get("name")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> renameCalendar(HttpServletRequest req,
                                            @PathVariable String id,
                                            @RequestBody Map<String, String> body) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.renameCalendar(uid, id, body.get("name")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCalendar(HttpServletRequest req,
                                            @PathVariable String id) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.deleteCalendar(uid, id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<?> addMember(HttpServletRequest req,
                                       @PathVariable String id,
                                       @RequestBody Map<String, String> body) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.addMember(uid, id, body.get("email"), body.get("role")));
    }

    @DeleteMapping("/{id}/members")
    public ResponseEntity<?> removeMember(HttpServletRequest req,
                                          @PathVariable String id,
                                          @RequestBody Map<String, String> body) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.removeMember(uid, id, body.get("memberId")));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<?> getMembers(HttpServletRequest req,
                                        @PathVariable String id) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.getCalendarMembers(uid, id));
    }

    @PutMapping("/{id}/members/{memberId}")
    public ResponseEntity<?> updateRole(HttpServletRequest req,
                                        @PathVariable String id,
                                        @PathVariable String memberId,
                                        @RequestBody Map<String, String> body) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.updateMemberRole(uid, id, memberId, body.get("role")));
    }

    @GetMapping("/{id}/share")
    public ResponseEntity<?> getShare(HttpServletRequest req,
                                      @PathVariable String id) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.getShareInfo(uid, id));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<?> createShare(HttpServletRequest req,
                                         @PathVariable String id,
                                         @RequestParam(required = false) boolean rotate) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.generateShareLink(uid, id, rotate));
    }

    @DeleteMapping("/{id}/share")
    public ResponseEntity<?> revokeShare(HttpServletRequest req,
                                         @PathVariable String id) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.revokeShareLink(uid, id));
    }

    @PostMapping("/join/{token}")
    public ResponseEntity<?> joinByToken(HttpServletRequest req,
                                         @PathVariable String token) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.joinByToken(uid, token));
    }

    @GetMapping("/search/{keyword}")
    public ResponseEntity<?> search(@PathVariable String keyword) {
        return ResponseEntity.ok(service.searchCalendars(keyword));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<?> leave(HttpServletRequest req,
                                   @PathVariable String id) {

        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.leaveCalendar(uid, id));
    }

    // ================================
    //  AI 명령 엔드포인트
    // ================================
@PostMapping("/ai/command")
public ResponseEntity<?> handleAiCommand(HttpServletRequest req,
                                         @RequestBody Map<String, String> body) throws Exception {

    String uid = (String) req.getAttribute("uid");
    String message = body.get("message");

    RestTemplate rest = new RestTemplate();
    String url = "http://localhost:8000/ai/analyze";

    Map<String, String> requestBody = new HashMap<>();
    requestBody.put("message", message);

    Map response = rest.postForObject(url, requestBody, Map.class);
    String cleanJson = (String) response.get("result");

    ObjectMapper mapper = new ObjectMapper();
    Map<String, Object> data = mapper.readValue(cleanJson, Map.class);

    String action = (String) data.get("action");
    String title = (String) data.get("title");
    String dateText = (String) data.get("date");
    String timeText = (String) data.get("time");
    String details = (String) data.get("details");
    String repeat = (String) data.getOrDefault("repeat", "none");

    Integer repeatCount = 1;
    Object repeatCountObj = data.get("repeatCount");
    if (repeatCountObj instanceof Number) {
        repeatCount = ((Number) repeatCountObj).intValue();
    }

    // ✅ calendarId는 "프론트(body)"가 최우선
    String calendarIdFromClient = body.get("calendarId");
    String calendarIdFromAi = (String) data.get("calendarId");

    String calendarId = (calendarIdFromClient != null && !calendarIdFromClient.isBlank())
            ? calendarIdFromClient
            : calendarIdFromAi;

    if (calendarId == null || calendarId.isBlank()) {
        calendarId = service.getDefaultCalendar(uid);
    }

    if (dateText == null || dateText.isBlank()) dateText = message;
    if (timeText == null || timeText.isBlank()) timeText = message;

    LocalDateTime eventDateTime = parseNaturalDate(dateText, timeText);

    switch (action) {
        case "add":
            if ("weekly".equals(repeat) && repeatCount > 1) {
                return ResponseEntity.ok(
                        service.addWeeklyEvents(uid, title, details, eventDateTime, calendarId, repeatCount)
                );
            } else {
                return ResponseEntity.ok(
                        service.addEvent(uid, title, details, eventDateTime, calendarId)
                );
            }

        case "update":
            return ResponseEntity.ok(service.updateEvent(uid, title, details, eventDateTime, calendarId));

        case "delete":
            return ResponseEntity.ok(service.deleteEvent(uid, title, eventDateTime, calendarId));

        case "recommend":
            return ResponseEntity.ok(service.recommendSchedule(uid));

        case "createCalendar":
            return ResponseEntity.ok(service.createCalendar(uid, title));

        default:
            return ResponseEntity.badRequest().body("알 수 없는 명령: " + action);
    }
}


    // ================================
    //  자연어 날짜/시간 파서
    // ================================
    private LocalDateTime parseNaturalDate(String dateText, String timeText) {

    LocalDate today = LocalDate.now();
    LocalDate date = today;

    // ================================
    // 🔥 날짜 해석
    // ================================
    try {
        // 1) YYYY-MM-DD 형태면 그대로 파싱
        if (dateText != null && dateText.matches("\\d{4}-\\d{2}-\\d{2}")) {
            date = LocalDate.parse(dateText);
        } 
        // 2) 자연어 해석
        else if (dateText != null) {

            if (dateText.contains("오늘")) {
                date = today;

            } else if (dateText.contains("내일")) {
                date = today.plusDays(1);

            } else if (dateText.contains("모레")) {
                date = today.plusDays(2);

            } else if (dateText.contains("다음주")) {
                DayOfWeek dow = extractDayOfWeek(dateText);
                if (dow != null) {
                    date = today.plusWeeks(1).with(dow);
                }

            } else {
                // 그냥 '목요일', '화', '수요일' 이런 경우
                DayOfWeek dow = extractDayOfWeek(dateText);
                if (dow != null) {
                    date = today.with(TemporalAdjusters.nextOrSame(dow));
                }
            }
        }

    } catch (Exception e) {
        date = today; // fallback
    }


    // ================================
    // 🔥 시간 해석
    // ================================
    LocalTime time = LocalTime.of(9, 0); // default

    try {
        if (timeText != null) {

            // "14:30" 형태 먼저 체크
            if (timeText.matches(".*\\d{1,2}:\\d{2}.*")) {
                String clean = timeText.replaceAll("[^0-9:]", "");
                String[] p = clean.split(":");
                int h = Integer.parseInt(p[0]);
                int m = Integer.parseInt(p[1]);
                time = LocalTime.of(h, m);
            }

            else {
                boolean pm = timeText.contains("오후") || timeText.contains("pm");
                boolean am = timeText.contains("오전") || timeText.contains("am");

                String number = timeText.replaceAll("[^0-9]", "");
                if (!number.isEmpty()) {
                    int hour = Integer.parseInt(number);

                    if (pm && hour < 12) hour += 12;
                    if (am && hour == 12) hour = 0;

                    time = LocalTime.of(hour, 0);
                }
            }

        }
    } catch (Exception e) {
        time = LocalTime.of(9, 0);
    }

    return LocalDateTime.of(date, time);
}


    private DayOfWeek extractDayOfWeek(String text) {
        if (text == null) return null;
        if (text.contains("월")) return DayOfWeek.MONDAY;
        if (text.contains("화")) return DayOfWeek.TUESDAY;
        if (text.contains("수")) return DayOfWeek.WEDNESDAY;
        if (text.contains("목")) return DayOfWeek.THURSDAY;
        if (text.contains("금")) return DayOfWeek.FRIDAY;
        if (text.contains("토")) return DayOfWeek.SATURDAY;
        if (text.contains("일")) return DayOfWeek.SUNDAY;
        return null;
    }
}
