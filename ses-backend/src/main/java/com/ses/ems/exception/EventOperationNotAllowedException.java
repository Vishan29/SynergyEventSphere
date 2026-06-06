package com.ses.ems.exception;

/**
 * Thrown when the requested change to an event violates a business rule
 * (e.g. cancelling an already-cancelled event, lowering capacity below the
 * number of active bookings, modifying an event that has already started).
 */
public class EventOperationNotAllowedException extends RuntimeException {

    public EventOperationNotAllowedException(String message) {
        super(message);
    }
}
