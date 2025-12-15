package com.example.calendar.entity;

public class Member {

    private String user;   // Usuario _id
    private String role;   // viewer | editor

    public Member() {}

    public Member(String user, String role) {
        this.user = user;
        this.role = role;
    }

    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
