package com.ses.ems.util;

import com.ses.ems.config.JwtProperties;
import com.ses.ems.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtUtil {

    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_SESSION_ID = "sid";
    public static final String CLAIM_USER_ID = "uid";

    private final JwtProperties properties;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        byte[] keyBytes = resolveKeyBytes(properties.getSecret());
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret must decode to at least 32 bytes for HS256");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public IssuedToken issueToken(User user, String sessionId) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(properties.getExpirationMs());

        String token = Jwts.builder()
                .setSubject(user.getEmail())
                .claim(CLAIM_USER_ID, user.getId())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_SESSION_ID, sessionId)
                .setIssuer(properties.getIssuer())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();

        return new IssuedToken(token, now, expiresAt);
    }

    public Optional<Claims> parse(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .requireIssuer(properties.getIssuer())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public String getSessionId(Claims claims) {
        return claims.get(CLAIM_SESSION_ID, String.class);
    }

    public String getRole(Claims claims) {
        return claims.get(CLAIM_ROLE, String.class);
    }

    public Long getUserId(Claims claims) {
        Number raw = claims.get(CLAIM_USER_ID, Number.class);
        return raw == null ? null : raw.longValue();
    }

    private byte[] resolveKeyBytes(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("app.jwt.secret must be configured");
        }
        try {
            return Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException ex) {
            return secret.getBytes(StandardCharsets.UTF_8);
        }
    }

    public record IssuedToken(String token, Instant issuedAt, Instant expiresAt) {
    }
}
