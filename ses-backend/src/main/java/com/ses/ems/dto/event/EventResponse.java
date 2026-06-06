package com.ses.ems.dto.event;

import com.ses.ems.dto.user.UserSummary;
import com.ses.ems.dto.venue.VenueSummary;
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
public class EventResponse {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime dateTime;
    private EventStatus status;

    private UserSummary organizer;
    private VenueSummary venue;
    private String customVenueName;
    private String customLocation;

    private Integer capacity;
    private long bookedSeats;
    private long availableSeats;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
