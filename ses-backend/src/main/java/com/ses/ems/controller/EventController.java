package com.ses.ems.controller;

import com.ses.ems.dto.event.CreateEventRequest;
import com.ses.ems.dto.event.EventResponse;
import com.ses.ems.dto.event.EventSummary;
import com.ses.ems.dto.event.UpdateEventRequest;
import com.ses.ems.model.enums.EventStatus;
import com.ses.ems.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<EventResponse> create(@Valid @RequestBody CreateEventRequest request) {
        EventResponse response = eventService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody UpdateEventRequest request) {
        return ResponseEntity.ok(eventService.update(id, request));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.cancel(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getById(id));
    }

    @GetMapping
    public ResponseEntity<Page<EventSummary>> search(
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String q,
            @RequestParam(name = "upcomingOnly", defaultValue = "false") boolean upcomingOnly,
            @PageableDefault(size = 20, sort = "dateTime", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(eventService.search(status, from, to, q, upcomingOnly, pageable));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Page<EventSummary>> mine(
            @PageableDefault(size = 20, sort = "dateTime", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(eventService.listForCurrentOrganizer(pageable));
    }
}
