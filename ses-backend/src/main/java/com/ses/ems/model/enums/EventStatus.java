package com.ses.ems.model.enums;

/**
 * Lifecycle of an {@link com.ses.ems.model.Event}.
 *
 * <p><b>Storage contract:</b> only {@link #SCHEDULED} and {@link #CANCELLED}
 * are ever persisted to the {@code events.status} column. {@link #COMPLETED}
 * is a <i>derived</i> view-state computed at the API boundary as
 * {@code (storedStatus == SCHEDULED && dateTime < now)}.</p>
 *
 * <p>This avoids needing a scheduled job (or DB trigger) to flip events to
 * COMPLETED, eliminates clock-skew/lag, and keeps the persistence model
 * minimal. If you ever need <i>side effects</i> tied to event completion
 * (notifications, analytics rollups), do them with a read-only scheduled
 * job that scans for ended events &mdash; never mutate the column.</p>
 */
public enum EventStatus {
    SCHEDULED,
    CANCELLED,
    COMPLETED
}
