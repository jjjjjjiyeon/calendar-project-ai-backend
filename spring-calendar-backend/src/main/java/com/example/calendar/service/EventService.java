package com.example.calendar.service;

import com.example.calendar.entity.Calendar;
import com.example.calendar.entity.Evento;
import com.example.calendar.repository.CalendarRepository;
import com.example.calendar.repository.EventoRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class EventService {

    @Autowired
    private EventoRepository eventoRepo;

    @Autowired
    private CalendarRepository calendarRepo;


    /* ==========================================================
       1) GET /api/events
       ========================================================== */
    public Map<String, Object> getEvents(String uid, String calendarId) {

        try {
            // owner 또는 member
            List<String> allowed = calendarRepo.findAll().stream()
                    .filter(c ->
                            Objects.equals(c.getOwner(), uid) ||
                            c.getMembers().stream()
                                    .anyMatch(m -> Objects.equals(m.getUser(), uid))
                    )
                    .map(Calendar::getId)
                    .collect(Collectors.toList());

            List<Evento> eventos;

            if (calendarId != null) {
                if (!allowed.contains(calendarId)) {
                    return Map.of("ok", false, "msg", "No autorizado para este calendario");
                }
                eventos = eventoRepo.findByCalendarId(calendarId);
            } else {
                eventos = eventoRepo.findByCalendarIdIn(allowed);
            }

            return Map.of("ok", true, "eventos", eventos);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Hable con el administrador");
        }
    }


    /* ==========================================================
       2) POST /api/events — 생성 (editor/owner만)
       ========================================================== */
    public Map<String, Object> createEvent(String uid, Evento data) {

        try {
            Calendar cal = calendarRepo.findById(data.getCalendarId()).orElse(null);
            if (cal == null) return Map.of("ok", false, "msg", "Calendar no existe");

            // 🔥 editor 또는 owner만 생성 가능
            boolean canEdit =
                    Objects.equals(cal.getOwner(), uid) ||
                    cal.getMembers().stream().anyMatch(
                            m -> Objects.equals(m.getUser(), uid) &&
                                 m.getRole().equals("editor")
                    );

            if (!canEdit)
                return Map.of("ok", false, "msg", "No autorizado");

            data.setUser(uid);
            Evento saved = eventoRepo.save(data);

            return Map.of("ok", true, "evento", saved);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Hable con el administrador");
        }
    }



    /* ==========================================================
       3) PUT /api/events/:id — 수정 (작성자/editor/owner만)
       ========================================================== */
    public Map<String, Object> updateEvent(String uid, String id, Evento data) {

        try {
            Evento old = eventoRepo.findById(id).orElse(null);
            if (old == null) return Map.of("ok", false, "msg", "Evento no existe");

            Calendar cal = calendarRepo.findById(old.getCalendarId()).orElse(null);
            if (cal == null) return Map.of("ok", false, "msg", "Calendar no existe");

            boolean isOwnerOfEvent = Objects.equals(old.getUser(), uid);

            boolean canEdit =
                    isOwnerOfEvent ||
                    Objects.equals(cal.getOwner(), uid) ||
                    cal.getMembers().stream().anyMatch(
                            m -> Objects.equals(m.getUser(), uid) &&
                                 m.getRole().equals("editor")
                    );

            if (!canEdit)
                return Map.of("ok", false, "msg", "No autorizado");

            old.setTitle(data.getTitle());
            old.setNotes(data.getNotes());
            old.setStart(data.getStart());
            old.setEnd(data.getEnd());
            old.setColor(data.getColor());

            Evento saved = eventoRepo.save(old);

            return Map.of("ok", true, "evento", saved);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Hable con el administrador");
        }
    }



    /* ==========================================================
       4) DELETE /api/events/:id — 삭제 (작성자/editor/owner만)
       ========================================================== */
    public Map<String, Object> deleteEvent(String uid, String id) {

        try {
            Evento old = eventoRepo.findById(id).orElse(null);
            if (old == null) return Map.of("ok", false, "msg", "Evento no existe");

            Calendar cal = calendarRepo.findById(old.getCalendarId()).orElse(null);
            if (cal == null) return Map.of("ok", false, "msg", "Calendar no existe");

            boolean isOwnerOfEvent = Objects.equals(old.getUser(), uid);

            boolean canDelete =
                    isOwnerOfEvent ||
                    Objects.equals(cal.getOwner(), uid) ||
                    cal.getMembers().stream().anyMatch(
                            m -> Objects.equals(m.getUser(), uid) &&
                                 m.getRole().equals("editor")
                    );

            if (!canDelete)
                return Map.of("ok", false, "msg", "No autorizado");

            eventoRepo.deleteById(id);

            return Map.of("ok", true);

        } catch (Exception e) {
            return Map.of("ok", false, "msg", "Hable con el administrador");
        }
    }
}
