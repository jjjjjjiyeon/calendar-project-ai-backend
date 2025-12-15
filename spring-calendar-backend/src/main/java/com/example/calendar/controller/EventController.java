package com.example.calendar.controller;

import com.example.calendar.entity.Evento;
import com.example.calendar.service.EventService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private EventService service;

    @GetMapping
    public ResponseEntity<?> getEvents(
            HttpServletRequest req,
            @RequestParam(required = false) String calendarId
    ) {
        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.getEvents(uid, calendarId));
    }

    @PostMapping
    public ResponseEntity<?> createEvent(
            HttpServletRequest req,
            @RequestBody Evento data
    ) {
        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.createEvent(uid, data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            HttpServletRequest req,
            @PathVariable String id,
            @RequestBody Evento data
    ) {
        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.updateEvent(uid, id, data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(
            HttpServletRequest req,
            @PathVariable String id
    ) {
        String uid = (String) req.getAttribute("uid");
        return ResponseEntity.ok(service.deleteEvent(uid, id));
    }
}
