package com.ses.ems.controller;

import com.ses.ems.dto.booking.BookingResponse;
import com.ses.ems.dto.booking.BookingSummary;
import com.ses.ems.dto.booking.CreateBookingRequest;
import com.ses.ems.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody CreateBookingRequest request) {
        BookingResponse response = bookingService.book(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancel(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<Page<BookingSummary>> listMine(
            @PageableDefault(size = 20, sort = "bookingTime", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(bookingService.listMine(pageable));
    }

    @GetMapping("/by-event/{eventId}")
    public ResponseEntity<Page<BookingSummary>> listByEvent(
            @PathVariable Long eventId,
            @PageableDefault(size = 20, sort = "bookingTime", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(bookingService.listByEvent(eventId, pageable));
    }
}
