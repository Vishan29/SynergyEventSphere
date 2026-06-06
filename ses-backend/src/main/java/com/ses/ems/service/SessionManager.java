package com.ses.ems.service;

import com.ses.ems.config.JwtProperties;
import com.ses.ems.model.User;
import com.ses.ems.model.UserSession;
import com.ses.ems.repository.UserSessionRepository;
import com.ses.ems.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.UUID;

/**
 * Encapsulates session lifecycle so both authentication and user services
 * can issue/revoke sessions through a single, reusable component.
 */
@Component
@RequiredArgsConstructor
public class SessionManager {

    private final UserSessionRepository sessionRepository;
    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;

    @Transactional
    public IssuedSession createSession(User user) {
        String sessionId = UUID.randomUUID().toString();
        JwtUtil.IssuedToken issued = jwtUtil.issueToken(user, sessionId);

        UserSession session = UserSession.builder()
                .sessionId(sessionId)
                .user(user)
                .active(true)
                .issuedAt(issued.issuedAt())
                .expiresAt(issued.expiresAt())
                .userAgent(currentHeader("User-Agent"))
                .ipAddress(currentRemoteAddress())
                .build();
        sessionRepository.save(session);

        return new IssuedSession(issued.token(), issued.issuedAt(), issued.expiresAt());
    }

    @Transactional
    public void revokeSession(String sessionId) {
        if (sessionId == null) {
            return;
        }
        sessionRepository.revokeBySessionId(sessionId, Instant.now());
    }

    @Transactional
    public void revokeAllSessionsForUser(Long userId) {
        sessionRepository.revokeAllForUser(userId, Instant.now());
    }

    public long accessTokenTtlSeconds() {
        return jwtProperties.getExpirationMs() / 1000L;
    }

    private String currentHeader(String name) {
        HttpServletRequest request = currentRequest();
        return request == null ? null : request.getHeader(name);
    }

    private String currentRemoteAddress() {
        HttpServletRequest request = currentRequest();
        return request == null ? null : request.getRemoteAddr();
    }

    private HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes()
                instanceof ServletRequestAttributes attrs) {
            return attrs.getRequest();
        }
        return null;
    }

    public record IssuedSession(String token, Instant issuedAt, Instant expiresAt) {
    }
}
