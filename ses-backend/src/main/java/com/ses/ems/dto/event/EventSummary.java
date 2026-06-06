package com.ses.ems.dto.event;

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
public class EventSummary {

    private Long id;
    private String title;
    private LocalDateTime dateTime;
    private EventStatus status;

    private String venueName;
    private String location;

    private Integer capacity;
    private long bookedSeats;

    private Long organizerId;
    private String organizerName;
}
