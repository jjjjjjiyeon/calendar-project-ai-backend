package com.example.calendar.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "eventos")
public class Evento {

    @Id
    private String id;

    private String title;
    private String notes;

    private LocalDateTime start;
    private LocalDateTime end;

    private String user;        // Usuario _id
    private String calendarId;  // Calendar _id
    private String color;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getStart() { return start; }
    public void setStart(LocalDateTime start) { this.start = start; }

    public LocalDateTime getEnd() { return end; }
    public void setEnd(LocalDateTime end) { this.end = end; }

    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }

    public String getCalendarId() { return calendarId; }
    public void setCalendarId(String calendarId) { this.calendarId = calendarId; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
