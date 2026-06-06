package com.ses.ems.security;

import com.ses.ems.model.User;
import com.ses.ems.model.UserSession;
import com.ses.ems.repository.UserSessionRepository;
import com.ses.ems.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final UserSessionRepository sessionRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);
        if (token == null || SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<Claims> parsed = jwtUtil.parse(token);
        if (parsed.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        Claims claims = parsed.get();
        String sessionId = jwtUtil.getSessionId(claims);
        if (sessionId == null || !isSessionActive(sessionId)) {
            filterChain.doFilter(request, response);
            return;
        }

        CustomUserDetails userDetails =
                (CustomUserDetails) userDetailsService.loadUserByUsername(claims.getSubject());
        User user = userDetails.getUser();

        SessionAwareAuthenticationToken authentication = new SessionAwareAuthenticationToken(
                userDetails, null, userDetails.getAuthorities(), sessionId);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(AUTH_HEADER);
        if (!StringUtils.hasText(header) || !header.startsWith(BEARER_PREFIX)) {
            return null;
        }
        String token = header.substring(BEARER_PREFIX.length()).trim();
        return token.isEmpty() ? null : token;
    }

    private boolean isSessionActive(String sessionId) {
        return sessionRepository.findBySessionId(sessionId)
                .map(this::stillActive)
                .orElse(false);
    }

    private boolean stillActive(UserSession session) {
        return session.isActive() && session.getExpiresAt().isAfter(Instant.now());
    }
}
