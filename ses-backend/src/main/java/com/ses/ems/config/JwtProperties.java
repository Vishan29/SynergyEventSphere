package com.ses.ems.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * Base64-encoded HMAC-SHA256 secret (min 32 bytes when decoded).
     */
    private String secret;

    /**
     * Access token lifetime in milliseconds.
     */
    private long expirationMs = 3_600_000L;

    /**
     * Token issuer claim.
     */
    private String issuer = "ses-ems";
}
