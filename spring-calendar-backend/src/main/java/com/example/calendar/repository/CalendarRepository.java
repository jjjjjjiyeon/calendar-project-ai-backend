package com.example.calendar.repository;

import com.example.calendar.entity.Calendar;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CalendarRepository extends MongoRepository<Calendar, String> {
    Optional<Calendar> findByShareToken(String token);
}
