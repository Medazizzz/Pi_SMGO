package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.AuthRequest;
import com.example.contentmanagement.dto.AuthResponse;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.service.AuthenticationService;
import com.example.contentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Legacy Sarra auth compatibility endpoints.
 * Supports payload fields used by Sarra frontend bundle (email + motDePasse).
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class LegacyAuthController {

    private final AuthenticationService authenticationService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody Map<String, Object> payload) {
        String email = readString(payload, "email");
        String username = readString(payload, "username");
        String password = firstNonBlank(
                readString(payload, "password"),
                readString(payload, "motDePasse")
        );

        if (isBlank(username) && !isBlank(email)) {
            username = userRepository.findByEmail(email)
                    .map(User::getUsername)
                    .orElse(email);
        }

        AuthRequest request = AuthRequest.builder()
                .username(username)
                .password(password)
                .email(email)
                .build();

        return ResponseEntity.ok(authenticationService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody Map<String, Object> payload) {
        String email = readString(payload, "email");
        String username = readString(payload, "username");
        String password = firstNonBlank(
                readString(payload, "password"),
                readString(payload, "motDePasse")
        );

        if (isBlank(username) && !isBlank(email)) {
            username = buildUsernameFromEmail(email);
        }

        AuthRequest request = AuthRequest.builder()
                .username(username)
                .password(password)
                .email(email)
                .build();

        AuthResponse response = authenticationService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    private String buildUsernameFromEmail(String email) {
        String local = email;
        int at = email.indexOf('@');
        if (at > 0) {
            local = email.substring(0, at);
        }

        String base = local.replaceAll("[^a-zA-Z0-9_]", "_");
        if (base.length() < 3) {
            base = "user_" + base;
        }

        String candidate = base;
        int suffix = 1;
        while (userRepository.findByUsername(candidate).isPresent()) {
            candidate = base + "_" + suffix;
            suffix++;
        }

        return candidate;
    }

    private static String readString(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            return null;
        }
        return String.valueOf(value).trim();
    }

    private static String firstNonBlank(String first, String second) {
        if (!isBlank(first)) {
            return first;
        }
        return second;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
