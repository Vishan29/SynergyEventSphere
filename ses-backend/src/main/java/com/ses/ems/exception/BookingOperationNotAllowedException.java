package com.ses.ems.exception;

/**
 * Thrown when a booking action violates a business rule (e.g. booking a
 * cancelled or completed event, double-booking, booking when capacity is
 * exhausted, or cancelling an already-cancelled booking).
 */
public class BookingOperationNotAllowedException extends RuntimeException {

    public BookingOperationNotAllowedException(String message) {
        super(message);
    }
}
