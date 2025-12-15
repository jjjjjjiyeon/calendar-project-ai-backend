package com.example.calendar.service;

import com.example.calendar.entity.Usuario;
import com.example.calendar.repository.UsuarioRepository;
import com.example.calendar.security.JwtTokenProvider;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtProvider;


    /* ==========================================================
       🔥 회원가입(createUsuario) — Node.js 대응
       ========================================================== */
    public Map<String, Object> register(String name, String email, String password) {

        if (usuarioRepo.findByEmail(email).isPresent()) {
            return Map.of("ok", false, "msg", "El usuario ya existe");
        }

        Usuario u = new Usuario();
        u.setName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(password));

        usuarioRepo.save(u);

        String token = jwtProvider.createToken(u.getId(), u.getName());

        return Map.of(
            "ok", true,
            "uid", u.getId(),
            "name", u.getName(),
            "token", token
        );
    }


    /* ==========================================================
       🔥 로그인(loginUsuario)
       ========================================================== */
    public Map<String, Object> login(String email, String password) {

        Usuario u = usuarioRepo.findByEmail(email)
                .orElse(null);

        if (u == null) {
            return Map.of("ok", false, "msg", "El usuario no existe con ese email");
        }

        if (!passwordEncoder.matches(password, u.getPassword())) {
            return Map.of("ok", false, "msg", "Password incorrecto");
        }

        String token = jwtProvider.createToken(u.getId(), u.getName());

        return Map.of(
            "ok", true,
            "uid", u.getId(),
            "name", u.getName(),
            "token", token
        );
    }


    /* ==========================================================
       🔥 토큰 재발급(renew)
       ========================================================== */
    public Map<String, Object> renew(String uid, String name) {

        String token = jwtProvider.createToken(uid, name);

        return Map.of(
            "ok", true,
            "uid", uid,
            "name", name,
            "token", token
        );
    }
}
