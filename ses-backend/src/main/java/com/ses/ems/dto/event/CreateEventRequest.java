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
 * Payload for creating an event.
 *
 * <p>Either {@code venueId} or the trio of {@code customVenueName},
 * {@code customLocation} and {@code capacity} must be supplied. When a
 * {@code venueId} is given, the event's capacity is taken from the chosen
 * venue and any client-supplied {@code capacity} is ignored.</p>
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateEventRequest {

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
