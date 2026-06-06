package com.ses.ems.mapper;

import com.ses.ems.dto.venue.CreateVenueRequest;
import com.ses.ems.dto.venue.VenueSummary;
import com.ses.ems.model.Venue;
import org.springframework.stereotype.Component;

@Component
public class VenueMapper {

    public Venue toEntity(CreateVenueRequest request) {
        return Venue.builder()
                .name(request.getName().trim())
                .location(request.getLocation().trim())
                .capacity(request.getCapacity())
                .build();
    }

    public VenueSummary toSummary(Venue venue) {
        if (venue == null) {
            return null;
        }
        return VenueSummary.builder()
                .id(venue.getId())
                .name(venue.getName())
                .location(venue.getLocation())
                .capacity(venue.getCapacity())
                .build();
    }
}
