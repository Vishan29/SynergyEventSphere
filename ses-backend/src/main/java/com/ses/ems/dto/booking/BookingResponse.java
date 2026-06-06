package com.ses.ems.dto.booking;

import com.ses.ems.dto.event.EventRef;
import com.ses.ems.dto.user.UserSummary;
import com.ses.ems.model.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {

    private Long id;
    private BookingStatus status;
    private LocalDateTime bookingTime;

    private UserSummary user;
    private EventRef event;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
