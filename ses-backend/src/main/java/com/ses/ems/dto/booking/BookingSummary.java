package com.ses.ems.dto.booking;

import com.ses.ems.model.enums.BookingStatus;
import com.ses.ems.model.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingSummary {

    private Long id;
    private BookingStatus status;
    private LocalDateTime bookingTime;

    private Long eventId;
    private String eventTitle;
    private LocalDateTime eventDateTime;
    private EventStatus eventStatus;
    private String eventLocation;

    private Long userId;
    private String userName;
}
