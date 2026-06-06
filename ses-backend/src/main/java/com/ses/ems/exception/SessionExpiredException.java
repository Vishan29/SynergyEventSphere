package com.ses.ems.exception;

public class SessionExpiredException extends RuntimeException {

    public SessionExpiredException() {
        super("Session has expired or is no longer active");
    }

    public SessionExpiredException(String message) {
        super(message);
    }
}
