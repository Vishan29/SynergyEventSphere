package com.ses.ems.repository;

import com.ses.ems.model.Event;
import com.ses.ems.model.enums.EventStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository
        extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    Page<Event> findByOrganizerId(Long organizerId, Pageable pageable);

    List<Event> findByVenueId(Long venueId);

    Page<Event> findByDateTimeAfter(LocalDateTime dateTime, Pageable pageable);

    Page<Event> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    @Query("""
            SELECT e FROM Event e
            WHERE (:from IS NULL OR e.dateTime >= :from)
              AND (:to IS NULL OR e.dateTime <= :to)
            """)
    Page<Event> findInDateRange(@Param("from") LocalDateTime from,
                                @Param("to") LocalDateTime to,
                                Pageable pageable);

    /**
     * Composite search used by the public event listing.
     *
     * <p>Every parameter is optional (pass {@code null} to disable). The
     * caller is expected to translate "effective" status filters
     * (e.g. {@code COMPLETED}) into the appropriate combination of
     * {@code storedStatus} + date bounds before invoking this method.</p>
     *
     * @param storedStatus filter on the persisted column ({@code SCHEDULED}
     *                     or {@code CANCELLED} only; never {@code COMPLETED}).
     * @param from         inclusive lower bound on {@code dateTime}.
     * @param to           inclusive upper bound on {@code dateTime}.
     * @param before       exclusive upper bound on {@code dateTime}; useful
     *                     for expressing "strictly in the past" for the
     *                     derived COMPLETED filter.
     * @param q            case-insensitive substring search on title.
     */
    // NOTE: the original JPQL version of this search was replaced by
    // EventSpecifications + JpaSpecificationExecutor.findAll(Specification,
    // Pageable) so that null filter parameters are simply omitted from the
    // WHERE clause instead of being bound as untyped JDBC NULLs. PostgreSQL
    // refuses to plan a prepared statement when a parameter's type can't be
    // inferred from any non-IS-NULL usage, which is exactly what happens when
    // every JPQL reference to a filter param is "?= ... IS NULL OR ...".

    /**
     * Fetches an event with a row-level write lock. Used by the booking
     * creation flow so that two concurrent bookings cannot both pass the
     * "is there a free seat?" check and overcommit the venue.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Optional<Event> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT COUNT(b) FROM Booking b
            WHERE b.event.id = :eventId AND b.status = com.ses.ems.model.enums.BookingStatus.BOOKED
            """)
    long countActiveBookings(@Param("eventId") Long eventId);
}
