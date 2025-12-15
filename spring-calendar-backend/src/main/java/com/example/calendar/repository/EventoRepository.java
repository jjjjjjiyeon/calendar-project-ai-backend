package com.example.calendar.repository;

import com.example.calendar.entity.Evento;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventoRepository extends MongoRepository<Evento, String> {

    List<Evento> findByCalendarId(String calendarId);

    void deleteByCalendarId(String calendarId);

    List<Evento> findByCalendarIdIn(List<String> calendarIds);

    // ⭐ AI 일정 수정/삭제용
    Optional<Evento> findByTitleAndStart(String title, LocalDateTime start);
}
