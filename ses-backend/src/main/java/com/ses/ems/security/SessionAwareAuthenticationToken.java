package com.ses.ems.security;

import lombok.Getter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * Authentication token that also carries the JWT session id so downstream
 * components (e.g. logout, auditing) can identify the exact session in use.
 */
@Getter
public class SessionAwareAuthenticationToken extends UsernamePasswordAuthenticationToken {

    private final String sessionId;

    public SessionAwareAuthenticationToken(Object principal,
                                           Object credentials,
                                           Collection<? extends GrantedAuthority> authorities,
                                           String sessionId) {
        super(principal, credentials, authorities);
        this.sessionId = sessionId;
    }
}
