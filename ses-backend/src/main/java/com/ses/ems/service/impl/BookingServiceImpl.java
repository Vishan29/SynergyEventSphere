package com.ses.ems.service.impl;

import com.ses.ems.dto.booking.BookingResponse;
import com.ses.ems.dto.booking.BookingSummary;
import com.ses.ems.dto.booking.CreateBookingRequest;
import com.ses.ems.exception.BookingNotFoundException;
import com.ses.ems.exception.BookingOperationNotAllowedException;
import com.ses.ems.exception.EventFullException;
import com.ses.ems.exception.EventNotFoundException;
import com.ses.ems.mapper.BookingMapper;
import com.ses.ems.model.Booking;
import com.ses.ems.model.Event;
import com.ses.ems.model.User;
import com.ses.ems.model.enums.BookingStatus;
import com.ses.ems.model.enums.EventStatus;
import com.ses.ems.model.enums.Role;
import com.ses.ems.repository.BookingRepository;
import com.ses.ems.repository.EventRepository;
import com.ses.ems.service.BookingService;
import com.ses.ems.util.AuthenticatedUserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final BookingMapper bookingMapper;
    private final AuthenticatedUserUtil authenticatedUserUtil;

    @Override
    @Transactional
    public BookingResponse book(CreateBookingRequest request) {
        User current = authenticatedUserUtil.requireCurrentUser();

        // Pessimistic write lock on the event row so two concurrent bookings
        // cannot both pass the capacity check and overcommit the venue.
        Event event = eventRepository.findByIdForUpdate(request.getEventId())
                .orElseThrow(() -> new EventNotFoundException(request.getEventId()));

        requireEventBookable(event);

        // If the user has previously cancelled a booking for this event, the
        // unique (user_id, event_id) constraint forbids a second row, so we
        // reactivate the existing one instead of inserting a duplicate.
        Booking booking = bookingRepository
                .findByUserIdAndEventId(current.getId(), event.getId())
                .orElseGet(() -> Booking.builder()
                        .user(current)
                        .event(event)
                        .status(BookingStatus.CANCELLED) // overwritten below
                        .build());

        if (booking.getStatus() == BookingStatus.BOOKED) {
            throw new BookingOperationNotAllowedException(
                    "You already have an active booking for this event");
        }

        long activeBookings = bookingRepository.countByEventIdAndStatus(
                event.getId(), BookingStatus.BOOKED);
        if (event.getCapacity() != null && activeBookings >= event.getCapacity()) {
            throw new EventFullException(event.getId(), event.getCapacity());
        }

        booking.setStatus(BookingStatus.BOOKED);
        Booking saved = bookingRepository.save(booking);
        log.info("User {} booked event {} (booking {})",
                current.getId(), event.getId(), saved.getId());

        return bookingMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BookingResponse cancel(Long bookingId) {
        User current = authenticatedUserUtil.requireCurrentUser();
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(bookingId));

        requireBookingOwnerOrAdmin(booking, current);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingOperationNotAllowedException("Booking is already cancelled");
        }

        Event event = booking.getEvent();
        if (event != null && event.getDateTime() != null
                && event.getDateTime().isBefore(LocalDateTime.now())) {
            throw new BookingOperationNotAllowedException(
                    "Bookings for events that have already started cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        log.info("User {} cancelled booking {} on event {}",
                current.getId(), saved.getId(), event != null ? event.getId() : null);

        return bookingMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getById(Long bookingId) {
        User current = authenticatedUserUtil.requireCurrentUser();
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(bookingId));

        requireBookingOwnerOrAdmin(booking, current);
        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingSummary> listMine(Pageable pageable) {
        User current = authenticatedUserUtil.requireCurrentUser();
        Page<Booking> bookings = bookingRepository
                .findByUserIdWithDetails(current.getId(), pageable);
        return bookings.map(bookingMapper::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookingSummary> listByEvent(Long eventId, Pageable pageable) {
        User current = authenticatedUserUtil.requireCurrentUser();
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId));

        boolean isOrganizer = event.getOrganizer() != null
                && event.getOrganizer().getId().equals(current.getId());
        boolean isAdmin = current.getRole() == Role.ADMIN;
        if (!isOrganizer && !isAdmin) {
            throw new AccessDeniedException(
                    "Only the event's organizer or an admin can view its bookings");
        }

        Page<Booking> bookings = bookingRepository
                .findByEventIdWithDetails(eventId, pageable);
        return bookings.map(bookingMapper::toSummary);
    }

    private void requireEventBookable(Event event) {
        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new BookingOperationNotAllowedException(
                    "Cannot book a cancelled event");
        }
        if (event.getDateTime() == null
                || event.getDateTime().isBefore(LocalDateTime.now())) {
            throw new BookingOperationNotAllowedException(
                    "Cannot book an event that has already started or completed");
        }
    }

    private void requireBookingOwnerOrAdmin(Booking booking, User user) {
        boolean isOwner = booking.getUser() != null
                && booking.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException(
                    "You are not allowed to access this booking");
        }
    }
}
