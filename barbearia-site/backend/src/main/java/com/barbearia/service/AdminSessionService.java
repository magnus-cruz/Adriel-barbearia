package com.barbearia.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminSessionService {

    private final String adminUser;
    private final String adminPassword;
    private final Map<String, Instant> sessions = new ConcurrentHashMap<>();

    public AdminSessionService(@Value("${app.admin.username:admin}") String adminUser,
                               @Value("${app.admin.password:123456}") String adminPassword) {
        this.adminUser = adminUser;
        this.adminPassword = adminPassword;
    }

    public String login(String username, String password) {
        if (!adminUser.equals(username) || !adminPassword.equals(password)) {
            throw new IllegalArgumentException("Credenciais invalidas");
        }
        String token = UUID.randomUUID().toString();
        sessions.put(token, Instant.now().plusSeconds(60 * 60 * 10));
        return token;
    }

    public boolean isTokenValido(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Instant expiry = sessions.get(token);
        if (expiry == null) {
            return false;
        }
        if (Instant.now().isAfter(expiry)) {
            sessions.remove(token);
            return false;
        }
        return true;
    }
}
