package com.ses.ems.service;

import com.ses.ems.dto.booking.BookingResponse;
import com.ses.ems.dto.booking.BookingSummary;
import com.ses.ems.dto.booking.CreateBookingRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookingService {

    BookingResponse book(CreateBookingRequest request);

    BookingResponse cancel(Long bookingId);

    BookingResponse getById(Long bookingId);

    Page<BookingSummary> listMine(Pageable pageable);

    Page<BookingSummary> listByEvent(Long eventId, Pageable pageable);
}
