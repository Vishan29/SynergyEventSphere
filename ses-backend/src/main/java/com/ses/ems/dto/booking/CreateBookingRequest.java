package com.ses.ems.dto.booking;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload for creating a booking. The user is taken from the authenticated
 * principal (never from the request body) and the booking is always created
 * with status {@code BOOKED}.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateBookingRequest {

    @NotNull(message = "eventId is required")
    private Long eventId;
}
