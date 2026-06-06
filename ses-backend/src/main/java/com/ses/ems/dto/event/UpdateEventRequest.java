package com.ses.ems.dto.event;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Payload for updating an existing event. Same shape as
 * {@link CreateEventRequest}: the venue and capacity rules apply identically.
 * The organizer cannot be changed via this endpoint.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateEventRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must be at most 150 characters")
    private String title;

    @Size(max = 5000, message = "Description must be at most 5000 characters")
    private String description;

    @NotNull(message = "Date and time are required")
    @Future(message = "Event date/time must be in the future")
    private LocalDateTime dateTime;

    private Long venueId;

    @Size(max = 150, message = "Custom venue name must be at most 150 characters")
    private String customVenueName;

    @Size(max = 255, message = "Custom location must be at most 255 characters")
    private String customLocation;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
}
