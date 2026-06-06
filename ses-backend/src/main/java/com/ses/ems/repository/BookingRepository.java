package com.ses.ems.repository;

import com.ses.ems.model.Booking;
import com.ses.ems.model.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByUserIdAndEventId(Long userId, Long eventId);

    boolean existsByUserIdAndEventIdAndStatus(Long userId, Long eventId, BookingStatus status);

    Page<Booking> findByUserId(Long userId, Pageable pageable);

    Page<Booking> findByEventId(Long eventId, Pageable pageable);

    List<Booking> findByEventIdAndStatus(Long eventId, BookingStatus status);

    long countByEventIdAndStatus(Long eventId, BookingStatus status);

    /**
     * List a user's bookings with the related event and user pre-fetched in
     * a single round-trip, avoiding N+1 queries when serialising the page.
     * The count query is supplied explicitly so it doesn't try to inline the
     * fetch joins.
     */
    @Query(value = """
            SELECT b FROM Booking b
            JOIN FETCH b.event e
            JOIN FETCH b.user u
            LEFT JOIN FETCH e.venue
            WHERE b.user.id = :userId
            """,
            countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.user.id = :userId")
    Page<Booking> findByUserIdWithDetails(@Param("userId") Long userId, Pageable pageable);

    /**
     * List bookings for an event with related user/event pre-fetched.
     */
    @Query(value = """
            SELECT b FROM Booking b
            JOIN FETCH b.event e
            JOIN FETCH b.user u
            LEFT JOIN FETCH e.venue
            WHERE b.event.id = :eventId
            """,
            countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.event.id = :eventId")
    Page<Booking> findByEventIdWithDetails(@Param("eventId") Long eventId, Pageable pageable);

    /**
     * Fetch a single booking with related user/event pre-loaded; used by the
     * detail endpoint so the response can be serialised after the
     * transaction has closed.
     */
    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.event e
            JOIN FETCH b.user u
            LEFT JOIN FETCH e.venue
            WHERE b.id = :id
            """)
    Optional<Booking> findByIdWithDetails(@Param("id") Long id);

    /**
     * Bulk-transition every booking on an event from one status to another.
     * Used when an organizer cancels an event and we need to flip every
     * outstanding {@code BOOKED} booking to {@code CANCELLED} in a single
     * round-trip. Returns the number of rows affected.
     *
     * <p>Because this is a JPQL bulk update, the persistence context will
     * not auto-flush stale entities for these rows; callers should ensure
     * they're not relying on previously loaded {@link Booking} instances.</p>
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Booking b
               SET b.status = :newStatus
             WHERE b.event.id = :eventId
               AND b.status = :currentStatus
            """)
    int updateStatusForEvent(@Param("eventId") Long eventId,
                             @Param("currentStatus") BookingStatus currentStatus,
                             @Param("newStatus") BookingStatus newStatus);
}
