package com.ses.ems.repository;

import com.ses.ems.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findBySessionId(String sessionId);

    @Modifying
    @Query("""
            update UserSession s
               set s.active = false,
                   s.revokedAt = :revokedAt
             where s.sessionId = :sessionId
               and s.active = true
            """)
    int revokeBySessionId(@Param("sessionId") String sessionId,
                          @Param("revokedAt") Instant revokedAt);

    @Modifying
    @Query("""
            update UserSession s
               set s.active = false,
                   s.revokedAt = :revokedAt
             where s.user.id = :userId
               and s.active = true
            """)
    int revokeAllForUser(@Param("userId") Long userId,
                         @Param("revokedAt") Instant revokedAt);
}
