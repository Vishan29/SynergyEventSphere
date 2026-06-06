package com.ses.ems.mapper;

import com.ses.ems.dto.event.EventRef;
import com.ses.ems.dto.event.EventResponse;
import com.ses.ems.dto.event.EventSummary;
import com.ses.ems.model.Event;
import com.ses.ems.model.User;
import com.ses.ems.model.Venue;
import com.ses.ems.model.enums.EventStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class EventMapper {

    private final UserMapper userMapper;
    private final VenueMapper venueMapper;

    public EventResponse toResponse(Event event, long bookedSeats) {
        long capacity = event.getCapacity() == null ? 0L : event.getCapacity();
        long available = Math.max(0L, capacity - bookedSeats);

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .dateTime(event.getDateTime())
                .status(effectiveStatus(event))
                .organizer(userMapper.toSummary(event.getOrganizer()))
                .venue(venueMapper.toSummary(event.getVenue()))
                .customVenueName(event.getCustomVenueName())
                .customLocation(event.getCustomLocation())
                .capacity(event.getCapacity())
                .bookedSeats(bookedSeats)
                .availableSeats(available)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    public EventSummary toSummary(Event event, long bookedSeats) {
        Venue venue = event.getVenue();
        User organizer = event.getOrganizer();

        return EventSummary.builder()
                .id(event.getId())
                .title(event.getTitle())
                .dateTime(event.getDateTime())
                .status(effectiveStatus(event))
                .venueName(venue != null ? venue.getName() : event.getCustomVenueName())
                .location(venue != null ? venue.getLocation() : event.getCustomLocation())
                .capacity(event.getCapacity())
                .bookedSeats(bookedSeats)
                .organizerId(organizer != null ? organizer.getId() : null)
                .organizerName(organizer != null ? organizer.getName() : null)
                .build();
    }

    public EventRef toRef(Event event) {
        Venue venue = event.getVenue();
        return EventRef.builder()
                .id(event.getId())
                .title(event.getTitle())
                .dateTime(event.getDateTime())
                .status(effectiveStatus(event))
                .venueName(venue != null ? venue.getName() : event.getCustomVenueName())
                .location(venue != null ? venue.getLocation() : event.getCustomLocation())
                .build();
    }

    /**
     * Projects the stored status into the effective lifecycle state. The
     * database only ever stores {@link EventStatus#SCHEDULED} or
     * {@link EventStatus#CANCELLED}; {@link EventStatus#COMPLETED} is a
     * pure function of {@code (storedStatus, dateTime)} and never persisted.
     */
    public EventStatus effectiveStatus(Event event) {
        EventStatus stored = event.getStatus();
        if (stored == EventStatus.CANCELLED) {
            return EventStatus.CANCELLED;
        }
        LocalDateTime dateTime = event.getDateTime();
        if (dateTime != null && dateTime.isBefore(LocalDateTime.now())) {
            return EventStatus.COMPLETED;
        }
        return EventStatus.SCHEDULED;
    }
}
