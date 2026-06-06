package com.ses.ems.service.impl;

import com.ses.ems.dto.auth.LoginRequest;
import com.ses.ems.dto.auth.LoginResponse;
import com.ses.ems.exception.InvalidCredentialsException;
import com.ses.ems.mapper.UserMapper;
import com.ses.ems.model.User;
import com.ses.ems.repository.UserRepository;
import com.ses.ems.service.AuthService;
import com.ses.ems.service.SessionManager;
import com.ses.ems.util.AuthenticatedUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SessionManager sessionManager;
    private final UserMapper userMapper;
    private final AuthenticatedUserUtil authenticatedUserUtil;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = authenticate(request.getEmail(), request.getPassword());
        SessionManager.IssuedSession issued = sessionManager.createSession(user);

        return LoginResponse.builder()
                .token(issued.token())
                .tokenType("Bearer")
                .issuedAt(issued.issuedAt())
                .expiresAt(issued.expiresAt())
                .user(userMapper.toSummary(user))
                .build();
    }

    @Override
    @Transactional
    public void logout() {
        authenticatedUserUtil.currentSessionId()
                .ifPresent(sessionManager::revokeSession);
    }

    @Override
    @Transactional
    public void logoutAllSessions() {
        User current = authenticatedUserUtil.requireCurrentUser();
        sessionManager.revokeAllSessionsForUser(current.getId());
    }

    /**
     * Verifies credentials and returns the managed User. Kept private so
     * login-like flows can be added (e.g. refresh) without duplicating logic.
     */
    private User authenticate(String rawEmail, String rawPassword) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase();
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(InvalidCredentialsException::new);
            if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
                throw new InvalidCredentialsException();
            }
            return user;
        } catch (AuthenticationException ex) {
            throw new InvalidCredentialsException();
        }
    }
}
