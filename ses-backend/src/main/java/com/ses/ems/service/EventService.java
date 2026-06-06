package com.ses.ems.service;

import com.ses.ems.dto.event.CreateEventRequest;
import com.ses.ems.dto.event.EventResponse;
import com.ses.ems.dto.event.EventSummary;
import com.ses.ems.dto.event.UpdateEventRequest;
import com.ses.ems.model.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface EventService {

    EventResponse create(CreateEventRequest request);

    EventResponse update(Long eventId, UpdateEventRequest request);

    EventResponse cancel(Long eventId);

    EventResponse getById(Long eventId);

    Page<EventSummary> search(EventStatus status,
                              LocalDateTime from,
                              LocalDateTime to,
                              String query,
                              boolean upcomingOnly,
                              Pageable pageable);

    Page<EventSummary> listForCurrentOrganizer(Pageable pageable);
}
