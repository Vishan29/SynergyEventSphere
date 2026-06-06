package com.ses.ems.repository;

import com.ses.ems.model.Event;
import com.ses.ems.model.enums.EventStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

/**
 * Composable filters for the event search endpoint. Building the WHERE
 * clause this way (instead of a single static JPQL with a chain of
 * {@code :param IS NULL OR ...} guards) keeps the resulting SQL free of
 * untyped JDBC NULL parameters &mdash; PostgreSQL otherwise refuses to
 * plan the statement with "could not determine data type of parameter".
 */
public final class EventSpecifications {

    private EventSpecifications() {
    }

    public static Specification<Event> hasStoredStatus(EventStatus storedStatus) {
        if (storedStatus == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), storedStatus);
    }

    public static Specification<Event> dateTimeAtOrAfter(LocalDateTime from) {
        if (from == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dateTime"), from);
    }

    public static Specification<Event> dateTimeAtOrBefore(LocalDateTime to) {
        if (to == null) {
            return null;
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("dateTime"), to);
    }

    public static Specification<Event> dateTimeBefore(LocalDateTime before) {
        if (before == null) {
            return null;
        }
        return (root, query, cb) -> cb.lessThan(root.get("dateTime"), before);
    }

    public static Specification<Event> titleContains(String q) {
        if (!StringUtils.hasText(q)) {
            return null;
        }
        String like = "%" + q.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("title")), like);
    }
}
