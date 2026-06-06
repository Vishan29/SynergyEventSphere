package com.ses.ems.exception;

/**
 * Thrown when an admin tries to delete a venue that is still referenced by
 * one or more events. The fix is to migrate or delete those events first.
 */
public class VenueInUseException extends RuntimeException {

    public VenueInUseException(Long venueId, long eventCount) {
        super("Venue " + venueId + " cannot be deleted because it is referenced by "
                + eventCount + " event(s); migrate or remove those events first");
    }
}
