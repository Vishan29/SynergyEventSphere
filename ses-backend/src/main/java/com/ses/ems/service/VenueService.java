package com.ses.ems.service;

import com.ses.ems.dto.venue.CreateVenueRequest;
import com.ses.ems.dto.venue.VenueSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface VenueService {

    VenueSummary create(CreateVenueRequest request);

    void delete(Long venueId);

    VenueSummary getById(Long venueId);

    Page<VenueSummary> search(String query, Pageable pageable);
}
