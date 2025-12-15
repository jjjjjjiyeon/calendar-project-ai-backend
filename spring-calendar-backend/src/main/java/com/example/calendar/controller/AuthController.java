package com.example.calendar.controller;

import com.example.calendar.dto.LoginRequest;
import com.example.calendar.dto.RegisterRequest;
import com.example.calendar.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService service;

    @PostMapping("/new")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        return ResponseEntity.ok(
                service.register(req.getName(), req.getEmail(), req.getPassword())
        );
    }

    // 로그인 — ★ "/api/auth" 로 POST 보낼 때 정확히 매칭되도록 수정 
    @PostMapping("")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(
                service.login(req.getEmail(), req.getPassword())
        );
    }

    @GetMapping("/renew")
    public ResponseEntity<?> renew(HttpServletRequest req) {
        String uid = (String) req.getAttribute("uid");
        String name = (String) req.getAttribute("name");

        return ResponseEntity.ok(service.renew(uid, name));
    }
}
