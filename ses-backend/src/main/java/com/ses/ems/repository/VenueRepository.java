package com.ses.ems.repository;

import com.ses.ems.model.Venue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {

    List<Venue> findByNameContainingIgnoreCase(String name);

    List<Venue> findByLocationContainingIgnoreCase(String location);

    List<Venue> findByCapacityGreaterThanEqual(Integer capacity);

    /**
     * Paged free-text search over name and location.
     *
     * <p>{@code q} must be non-null; pass an empty string for "no filter".
     * The empty-string sentinel exists to dodge a PostgreSQL quirk where a
     * raw SQL {@code NULL} bound into {@code LOWER(CONCAT('%', :q, '%'))}
     * is type-inferred to {@code bytea}, which has no {@code lower()}
     * overload and blows up the query.</p>
     */
    @Query("""
            SELECT v FROM Venue v
            WHERE :q = ''
               OR LOWER(v.name) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(v.location) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    Page<Venue> search(@Param("q") String q, Pageable pageable);
}
