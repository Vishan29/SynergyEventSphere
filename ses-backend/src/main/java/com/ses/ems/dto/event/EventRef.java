package com.ses.ems.dto.event;

import com.ses.ems.model.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Minimal event projection embedded in other resources (e.g. bookings)
 * where we want to identify the event without paying for the booking-count
 * subquery that {@link EventSummary} carries.
 */
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EventRef {

    private Long id;
    private String title;
    private LocalDateTime dateTime;
    private EventStatus status;
    private String venueName;
    private String location;
}
