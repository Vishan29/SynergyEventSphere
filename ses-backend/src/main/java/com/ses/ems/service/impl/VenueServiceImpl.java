package com.ses.ems.service.impl;

import com.ses.ems.dto.venue.CreateVenueRequest;
import com.ses.ems.dto.venue.VenueSummary;
import com.ses.ems.exception.VenueInUseException;
import com.ses.ems.exception.VenueNotFoundException;
import com.ses.ems.mapper.VenueMapper;
import com.ses.ems.model.Venue;
import com.ses.ems.repository.EventRepository;
import com.ses.ems.repository.VenueRepository;
import com.ses.ems.service.VenueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final EventRepository eventRepository;
    private final VenueMapper venueMapper;

    @Override
    @Transactional
    public VenueSummary create(CreateVenueRequest request) {
        Venue saved = venueRepository.save(venueMapper.toEntity(request));
        log.info("Admin created venue {} (\"{}\", capacity {})",
                saved.getId(), saved.getName(), saved.getCapacity());
        return venueMapper.toSummary(saved);
    }

    @Override
    @Transactional
    public void delete(Long venueId) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new VenueNotFoundException(venueId));

        // Refuse to orphan referencing events. The FK is RESTRICT, so the
        // delete would fail at the DB anyway -- this turns that low-level
        // ConstraintViolationException into a clean 409 with a helpful
        // message that tells the admin exactly what's blocking them.
        long referencingEvents = eventRepository.findByVenueId(venueId).size();
        if (referencingEvents > 0) {
            throw new VenueInUseException(venueId, referencingEvents);
        }

        venueRepository.delete(venue);
        log.info("Admin deleted venue {}", venueId);
    }

    @Override
    @Transactional(readOnly = true)
    public VenueSummary getById(Long venueId) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new VenueNotFoundException(venueId));
        return venueMapper.toSummary(venue);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VenueSummary> search(String query, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : "";
        return venueRepository.search(normalized, pageable).map(venueMapper::toSummary);
    }
}
