package com.ses.ems.mapper;

import com.ses.ems.dto.booking.BookingResponse;
import com.ses.ems.dto.booking.BookingSummary;
import com.ses.ems.model.Booking;
import com.ses.ems.model.Event;
import com.ses.ems.model.User;
import com.ses.ems.model.Venue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookingMapper {

    private final UserMapper userMapper;
    private final EventMapper eventMapper;

    public BookingResponse toResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .status(booking.getStatus())
                .bookingTime(booking.getBookingTime())
                .user(userMapper.toSummary(booking.getUser()))
                .event(eventMapper.toRef(booking.getEvent()))
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    public BookingSummary toSummary(Booking booking) {
        Event event = booking.getEvent();
        Venue venue = event != null ? event.getVenue() : null;
        User user = booking.getUser();

        return BookingSummary.builder()
                .id(booking.getId())
                .status(booking.getStatus())
                .bookingTime(booking.getBookingTime())
                .eventId(event != null ? event.getId() : null)
                .eventTitle(event != null ? event.getTitle() : null)
                .eventDateTime(event != null ? event.getDateTime() : null)
                .eventStatus(event != null ? eventMapper.effectiveStatus(event) : null)
                .eventLocation(venue != null
                        ? venue.getLocation()
                        : (event != null ? event.getCustomLocation() : null))
                .userId(user != null ? user.getId() : null)
                .userName(user != null ? user.getName() : null)
                .build();
    }
}
