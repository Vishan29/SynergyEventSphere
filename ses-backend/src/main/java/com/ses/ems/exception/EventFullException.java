package com.ses.ems.exception;

/**
 * Specific {@link BookingOperationNotAllowedException} thrown when an event
 * has no remaining seats. Inherits the {@code 409} mapping from the parent
 * but carries its own type so the UI (or future API clients) can match on
 * the class instead of parsing message strings.
 */
public class EventFullException extends BookingOperationNotAllowedException {

    public EventFullException(Long eventId, int capacity) {
        super("Event " + eventId + " is fully booked (capacity: " + capacity + " seats)");
    }
}
