package com.ses.ems.service.impl;

import com.ses.ems.dto.event.CreateEventRequest;
import com.ses.ems.dto.event.EventResponse;
import com.ses.ems.dto.event.EventSummary;
import com.ses.ems.dto.event.UpdateEventRequest;
import com.ses.ems.exception.EventNotFoundException;
import com.ses.ems.exception.EventOperationNotAllowedException;
import com.ses.ems.exception.VenueNotFoundException;
import com.ses.ems.mapper.EventMapper;
import com.ses.ems.model.Event;
import com.ses.ems.model.User;
import com.ses.ems.model.Venue;
import com.ses.ems.model.enums.BookingStatus;
import com.ses.ems.model.enums.EventStatus;
import com.ses.ems.model.enums.Role;
import com.ses.ems.repository.BookingRepository;
import com.ses.ems.repository.EventRepository;
import com.ses.ems.repository.EventSpecifications;
import com.ses.ems.repository.VenueRepository;
import com.ses.ems.service.EventService;
import com.ses.ems.util.AuthenticatedUserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final BookingRepository bookingRepository;
    private final EventMapper eventMapper;
    private final AuthenticatedUserUtil authenticatedUserUtil;

    @Override
    @Transactional
    public EventResponse create(CreateEventRequest request) {
        User organizer = authenticatedUserUtil.requireCurrentUser();
        requireRole(organizer, Role.ORGANIZER);

        ResolvedVenue resolved = resolveVenue(
                request.getVenueId(),
                request.getCustomVenueName(),
                request.getCustomLocation(),
                request.getCapacity(),
                0L);

        Event event = Event.builder()
                .title(request.getTitle().trim())
                .description(trimToNull(request.getDescription()))
                .dateTime(request.getDateTime())
                .organizer(organizer)
                .venue(resolved.venue())
                .customVenueName(resolved.customVenueName())
                .customLocation(resolved.customLocation())
                .capacity(resolved.capacity())
                .status(EventStatus.SCHEDULED)
                .build();

        Event saved = eventRepository.save(event);
        log.info("Organizer {} created event {} (\"{}\")",
                organizer.getId(), saved.getId(), saved.getTitle());

        return eventMapper.toResponse(saved, 0L);
    }

    @Override
    @Transactional
    public EventResponse update(Long eventId, UpdateEventRequest request) {
        User current = authenticatedUserUtil.requireCurrentUser();
        Event event = loadEvent(eventId);

        requireOwnerOrAdmin(event, current);
        requireMutable(event);

        long activeBookings = bookingRepository.countByEventIdAndStatus(eventId, BookingStatus.BOOKED);
        ResolvedVenue resolved = resolveVenue(
                request.getVenueId(),
                request.getCustomVenueName(),
                request.getCustomLocation(),
                request.getCapacity(),
                activeBookings);

        event.setTitle(request.getTitle().trim());
        event.setDescription(trimToNull(request.getDescription()));
        event.setDateTime(request.getDateTime());
        event.setVenue(resolved.venue());
        event.setCustomVenueName(resolved.customVenueName());
        event.setCustomLocation(resolved.customLocation());
        event.setCapacity(resolved.capacity());

        Event saved = eventRepository.save(event);
        log.info("User {} updated event {}", current.getId(), saved.getId());
        return eventMapper.toResponse(saved, activeBookings);
    }

    @Override
    @Transactional
    public EventResponse cancel(Long eventId) {
        User current = authenticatedUserUtil.requireCurrentUser();
        Event event = loadEvent(eventId);

        requireOwnerOrAdmin(event, current);
        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new EventOperationNotAllowedException("Event is already cancelled");
        }
        if (event.getDateTime() != null && event.getDateTime().isBefore(LocalDateTime.now())) {
            throw new EventOperationNotAllowedException(
                    "Events that have already completed cannot be cancelled");
        }

        event.setStatus(EventStatus.CANCELLED);
        eventRepository.save(event);

        int cancelledBookings = bookingRepository.updateStatusForEvent(
                eventId, BookingStatus.BOOKED, BookingStatus.CANCELLED);
        log.info("User {} cancelled event {}; {} active bookings were cancelled",
                current.getId(), eventId, cancelledBookings);

        long bookedSeats = bookingRepository.countByEventIdAndStatus(eventId, BookingStatus.BOOKED);
        return eventMapper.toResponse(event, bookedSeats);
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponse getById(Long eventId) {
        Event event = loadEvent(eventId);
        long bookedSeats = bookingRepository.countByEventIdAndStatus(eventId, BookingStatus.BOOKED);
        return eventMapper.toResponse(event, bookedSeats);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EventSummary> search(EventStatus status,
                                     LocalDateTime from,
                                     LocalDateTime to,
                                     String query,
                                     boolean upcomingOnly,
                                     Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime effectiveFrom = upcomingOnly ? maxDateTime(from, now) : from;
        LocalDateTime effectiveTo = to;
        LocalDateTime before = null;
        EventStatus storedStatus = null;

        // COMPLETED is derived (storedStatus = SCHEDULED && dateTime < now), so
        // we never push COMPLETED through to JPQL; we translate it into bounds.
        if (status != null) {
            switch (status) {
                case CANCELLED -> storedStatus = EventStatus.CANCELLED;
                case SCHEDULED -> {
                    storedStatus = EventStatus.SCHEDULED;
                    effectiveFrom = maxDateTime(effectiveFrom, now);
                }
                case COMPLETED -> {
                    storedStatus = EventStatus.SCHEDULED;
                    before = now;
                }
            }
        }

        String normalizedQuery = StringUtils.hasText(query) ? query.trim() : null;

        Specification<Event> spec = Specification.allOf(
                EventSpecifications.hasStoredStatus(storedStatus),
                EventSpecifications.dateTimeAtOrAfter(effectiveFrom),
                EventSpecifications.dateTimeAtOrBefore(effectiveTo),
                EventSpecifications.dateTimeBefore(before),
                EventSpecifications.titleContains(normalizedQuery)
        );

        Page<Event> events = eventRepository.findAll(spec, pageable);
        return events.map(this::toSummaryWithBookings);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EventSummary> listForCurrentOrganizer(Pageable pageable) {
        User current = authenticatedUserUtil.requireCurrentUser();
        Page<Event> events = eventRepository.findByOrganizerId(current.getId(), pageable);
        return events.map(this::toSummaryWithBookings);
    }

    private EventSummary toSummaryWithBookings(Event event) {
        long bookedSeats = bookingRepository.countByEventIdAndStatus(event.getId(), BookingStatus.BOOKED);
        return eventMapper.toSummary(event, bookedSeats);
    }

    private Event loadEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));
    }

    private void requireRole(User user, Role required) {
        if (user.getRole() != required) {
            throw new AccessDeniedException(
                    "Only users with role " + required + " can perform this action");
        }
    }

    private void requireOwnerOrAdmin(Event event, User user) {
        boolean isOrganizer = event.getOrganizer() != null
                && event.getOrganizer().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isOrganizer && !isAdmin) {
            throw new AccessDeniedException("You are not allowed to modify this event");
        }
    }

    private void requireMutable(Event event) {
        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new EventOperationNotAllowedException(
                    "Cancelled events cannot be modified");
        }
        if (event.getDateTime() != null && event.getDateTime().isBefore(LocalDateTime.now())) {
            throw new EventOperationNotAllowedException(
                    "Events that have already started cannot be modified");
        }
    }

    /**
     * Reconciles the venue/custom-venue inputs into a single coherent shape
     * and enforces the capacity rules:
     * <ul>
     *     <li>If {@code venueId} is supplied, the venue's capacity is used
     *     verbatim and the custom venue fields must be empty.</li>
     *     <li>Otherwise the caller must supply both custom venue fields and
     *     an explicit capacity.</li>
     *     <li>The resulting capacity must always be at least
     *     {@code minimumCapacity} (the count of currently active bookings)
     *     so no existing booking is orphaned.</li>
     * </ul>
     */
    private ResolvedVenue resolveVenue(Long venueId,
                                       String customVenueName,
                                       String customLocation,
                                       Integer requestedCapacity,
                                       long minimumCapacity) {
        boolean hasVenueId = venueId != null;
        boolean hasCustomFields = StringUtils.hasText(customVenueName)
                || StringUtils.hasText(customLocation);

        if (hasVenueId && hasCustomFields) {
            throw new EventOperationNotAllowedException(
                    "Provide either a venueId or custom venue details, not both");
        }

        if (hasVenueId) {
            Venue venue = venueRepository.findById(venueId)
                    .orElseThrow(() -> new VenueNotFoundException(venueId));
            if (venue.getCapacity() == null) {
                throw new EventOperationNotAllowedException(
                        "Selected venue has no capacity configured");
            }
            ensureCapacityFits(venue.getCapacity(), minimumCapacity);
            return new ResolvedVenue(venue, null, null, venue.getCapacity());
        }

        if (!StringUtils.hasText(customVenueName) || !StringUtils.hasText(customLocation)) {
            throw new EventOperationNotAllowedException(
                    "Either a venueId or both customVenueName and customLocation must be provided");
        }
        if (requestedCapacity == null) {
            throw new EventOperationNotAllowedException(
                    "Capacity is required when no venue is selected");
        }
        ensureCapacityFits(requestedCapacity, minimumCapacity);
        return new ResolvedVenue(
                null,
                customVenueName.trim(),
                customLocation.trim(),
                requestedCapacity);
    }

    private void ensureCapacityFits(int capacity, long minimumCapacity) {
        if (capacity < minimumCapacity) {
            throw new EventOperationNotAllowedException(
                    "Capacity (" + capacity + ") cannot be lower than the number of active bookings ("
                            + minimumCapacity + ")");
        }
    }

    private static LocalDateTime maxDateTime(LocalDateTime a, LocalDateTime b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record ResolvedVenue(Venue venue,
                                 String customVenueName,
                                 String customLocation,
                                 int capacity) {
    }
}
