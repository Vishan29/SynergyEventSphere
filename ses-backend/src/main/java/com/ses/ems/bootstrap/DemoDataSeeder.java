package com.ses.ems.bootstrap;

import com.ses.ems.model.Booking;
import com.ses.ems.model.Event;
import com.ses.ems.model.User;
import com.ses.ems.model.Venue;
import com.ses.ems.model.enums.BookingStatus;
import com.ses.ems.model.enums.EventStatus;
import com.ses.ems.model.enums.Role;
import com.ses.ems.repository.BookingRepository;
import com.ses.ems.repository.EventRepository;
import com.ses.ems.repository.UserRepository;
import com.ses.ems.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Idempotent demo data seeder. Every startup it:
 *
 * <ol>
 *   <li>Cleans up legacy timestamp-suffixed emails / venue names /
 *       event titles inherited from the Postman seed run (e.g.
 *       {@code sophie.nguyen+1778926133024@ses.test} →
 *       {@code sophie.nguyen@ses.test}).</li>
 *   <li>Tops each table up to a healthy target (
 *       {@link #TARGET_USERS}, {@link #TARGET_VENUES},
 *       {@link #TARGET_EVENTS}, {@link #TARGET_BOOKINGS}) so the UI
 *       always has something to render.</li>
 *   <li>Spreads new events across organizers and new bookings across
 *       users so the demo data looks naturally distributed.</li>
 * </ol>
 *
 * <p>Disable with {@code app.demo-seed.enabled=false} (e.g. in prod).</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

    private static final int TARGET_USERS    = 20;
    private static final int TARGET_VENUES   = 20;
    private static final int TARGET_EVENTS   = 30;
    private static final int TARGET_BOOKINGS = 90;
    /** Floor: every USER-role account should end up with at least this many bookings. */
    private static final int MIN_BOOKINGS_PER_USER = 10;

    private static final String SEED_PASSWORD = "Demo@12345";
    private static final String EMAIL_DOMAIN = "ses.test";

    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo-seed.enabled:true}")
    private boolean enabled;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Demo data seeder disabled via app.demo-seed.enabled=false");
            return;
        }

        log.info("Seeder snapshot before run: users={}, venues={}, events={}, bookings={}",
                userRepository.count(), venueRepository.count(),
                eventRepository.count(), bookingRepository.count());

        normalizeExistingUsers();
        normalizeExistingVenues();
        normalizeExistingEvents();

        seedUsers();
        seedVenues();
        seedEvents();
        rebalanceEventOwnership();
        seedBookings();

        log.info("Seeder snapshot after run:  users={}, venues={}, events={}, bookings={}",
                userRepository.count(), venueRepository.count(),
                eventRepository.count(), bookingRepository.count());
    }

    // -----------------------------------------------------------------
    // Cleanup of legacy timestamped data
    // -----------------------------------------------------------------

    /**
     * Strips Postman-style {@code +1778926133024} suffixes, strips redundant
     * role-name segments like {@code .admin}/{@code .events}/{@code .organizer}
     * from the local-part, and migrates any {@code @demo.ses.test} mailboxes
     * onto the canonical {@code @ses.test} domain.
     *
     * <p>If two accounts collapse to the same canonical email, the older
     * (lower-id) user wins and the newer one's owned events/bookings are
     * re-parented to the survivor before it's deleted, so the demo dataset
     * never has duplicate identities lingering.</p>
     */
    private void normalizeExistingUsers() {
        int renamed = 0;
        int merged = 0;
        // Snapshot the list first since we may delete entries during the loop.
        List<User> users = new ArrayList<>(userRepository.findAll());
        users.sort(Comparator.comparing(User::getId));

        for (User u : users) {
            String original = u.getEmail();
            if (original == null) continue;
            String cleaned = canonicalizeEmail(original);
            if (cleaned.equals(original)) continue;

            User collidingUser = userRepository.findByEmail(cleaned)
                    .filter(other -> !other.getId().equals(u.getId()))
                    .orElse(null);

            if (collidingUser != null) {
                // Keep the older user; merge whichever has the higher id INTO
                // the survivor and delete it.
                User survivor = u.getId() < collidingUser.getId() ? u : collidingUser;
                User duplicate = (survivor == u) ? collidingUser : u;
                log.info("Merging duplicate user {} <{}> into {} <{}>",
                        duplicate.getId(), duplicate.getEmail(),
                        survivor.getId(), survivor.getEmail());
                reassignOwnedRecords(duplicate, survivor);
                userRepository.delete(duplicate);
                merged++;

                if (survivor == u) {
                    u.setEmail(cleaned);
                    userRepository.save(u);
                    renamed++;
                }
                // else: u was the duplicate and is now deleted, move on.
                continue;
            }

            log.info("Renaming user {} email '{}' -> '{}'", u.getId(), original, cleaned);
            u.setEmail(cleaned);
            userRepository.save(u);
            renamed++;
        }
        if (renamed > 0 || merged > 0) {
            log.info("Normalized users: {} renamed, {} duplicates merged", renamed, merged);
        }
    }

    private String canonicalizeEmail(String email) {
        return email
                .replaceAll("\\+\\d+", "")
                .replaceAll("\\.(admin|events|organizer)(?=@)", "")
                .replace("@demo.ses.test", "@" + EMAIL_DOMAIN)
                .toLowerCase(Locale.ROOT);
    }

    /**
     * Reassign events / bookings / sessions owned by {@code duplicate} to
     * {@code survivor}, dropping any booking row whose new owner would
     * violate the {@code uk_booking_user_event} uniqueness constraint.
     */
    private void reassignOwnedRecords(User duplicate, User survivor) {
        for (Event e : eventRepository.findAll()) {
            if (e.getOrganizer() != null && e.getOrganizer().getId().equals(duplicate.getId())) {
                e.setOrganizer(survivor);
                eventRepository.save(e);
            }
        }
        for (Booking b : bookingRepository.findAll()) {
            if (b.getUser() == null || !b.getUser().getId().equals(duplicate.getId())) {
                continue;
            }
            boolean survivorAlreadyBooked = bookingRepository
                    .findByUserIdAndEventId(survivor.getId(), b.getEvent().getId())
                    .isPresent();
            if (survivorAlreadyBooked) {
                bookingRepository.delete(b);
            } else {
                b.setUser(survivor);
                bookingRepository.save(b);
            }
        }
    }

    /** Strips trailing whitespace+digits (e.g. {@code "Harborlight Annex 1778926138"}). */
    private void normalizeExistingVenues() {
        int renamed = 0;
        for (Venue v : venueRepository.findAll()) {
            String original = v.getName();
            if (original == null) continue;
            String cleaned = original.replaceAll("\\s+\\d{6,}\\s*$", "").trim();
            if (!cleaned.isEmpty() && !cleaned.equals(original)) {
                log.info("Renaming venue {} '{}' -> '{}'", v.getId(), original, cleaned);
                v.setName(cleaned);
                venueRepository.save(v);
                renamed++;
            }
        }
        if (renamed > 0) {
            log.info("Normalized {} venue names", renamed);
        }
    }

    private void normalizeExistingEvents() {
        int renamed = 0;
        for (Event e : eventRepository.findAll()) {
            String original = e.getTitle();
            if (original == null) continue;
            String cleaned = original.replaceAll("\\s+\\d{6,}\\s*$", "").trim();
            if (!cleaned.isEmpty() && !cleaned.equals(original)) {
                log.info("Renaming event {} '{}' -> '{}'", e.getId(), original, cleaned);
                e.setTitle(cleaned);
                eventRepository.save(e);
                renamed++;
            }
        }
        if (renamed > 0) {
            log.info("Normalized {} event titles", renamed);
        }
    }

    // -----------------------------------------------------------------
    // Users
    // -----------------------------------------------------------------

    private void seedUsers() {
        Object[][] roster = {
                // role,          first,         last
                {Role.ADMIN,      "Margaret",    "Whitford"},
                {Role.ADMIN,      "Noah",        "Brennan"},
                {Role.ADMIN,      "Jordan",      "Fischer"},

                {Role.ORGANIZER,  "Elena",       "Vasquez"},
                {Role.ORGANIZER,  "James",       "Okonkwo"},
                {Role.ORGANIZER,  "Dakota",      "Reyes"},
                {Role.ORGANIZER,  "Priya",       "Kapoor"},
                {Role.ORGANIZER,  "Marcus",      "Lindholm"},
                {Role.ORGANIZER,  "Naomi",       "Takahashi"},

                {Role.USER,       "Sophie",      "Nguyen"},
                {Role.USER,       "David",       "Morrison"},
                {Role.USER,       "Noah",        "Becker"},
                {Role.USER,       "Alex",        "Carter"},
                {Role.USER,       "Brooke",      "Miles"},
                {Role.USER,       "Cameron",     "Patel"},
                {Role.USER,       "Emery",       "Watanabe"},
                {Role.USER,       "Finley",      "OConnor"},
                {Role.USER,       "Greer",       "Nakamura"},
                {Role.USER,       "Hana",        "Petrova"},
                {Role.USER,       "Ishaan",      "Mehta"},
                {Role.USER,       "Jules",       "Ramirez"},
                {Role.USER,       "Kira",        "Albright"},
                {Role.USER,       "Liam",        "Donnelly"},
                {Role.USER,       "Maya",        "Steinberg"},
        };

        int added = 0;
        for (Object[] row : roster) {
            if (userRepository.count() >= TARGET_USERS) break;
            Role role = (Role) row[0];
            String first = (String) row[1];
            String last = (String) row[2];
            String name = first + " " + last;
            String email = (first + "." + last + "@" + EMAIL_DOMAIN).toLowerCase(Locale.ROOT);
            if (ensureUser(name, email, role) != null) {
                added++;
            }
        }
        log.info("Users top-up: added {} (total now {})", added, userRepository.count());
    }

    private User ensureUser(String name, String email, Role role) {
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        return userRepository.findByEmail(normalizedEmail).orElseGet(() -> {
            User u = User.builder()
                    .name(name)
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(SEED_PASSWORD))
                    .role(role)
                    .contactNo(null)
                    .build();
            User saved = userRepository.save(u);
            log.info("Seeded {} '{}' <{}>", role, name, normalizedEmail);
            return saved;
        });
    }

    // -----------------------------------------------------------------
    // Venues
    // -----------------------------------------------------------------

    private void seedVenues() {
        String[][] data = {
                {"The Grand Atrium",         "742 Evergreen Way, Springfield, IL",          "320"},
                {"Riverbend Conference Hub", "118 Cascade Drive, Portland, OR",             "180"},
                {"Skyline Loft",             "55 Beacon Street, Boston, MA",                "120"},
                {"Harbor Pavilion",          "401 Pier 21, Seattle, WA",                    "260"},
                {"Aurora Tech Park Hall A",  "9 Innovation Loop, Austin, TX",               "450"},
                {"The Old Foundry",          "23 Mill Lane, Brooklyn, NY",                  "200"},
                {"Crescent Garden Pavilion", "2700 Bayview Crescent, San Diego, CA",        "150"},
                {"Solstice Amphitheater",    "88 Sunset Ridge, Boulder, CO",                "600"},
                {"Northern Lights Centre",   "150 Aurora Boulevard, Anchorage, AK",         "220"},
                {"The Linden Banquet Hall",  "330 Linden Avenue, Chicago, IL",              "350"},
                {"Maple & Stone Hall",       "12 Maple Street, Toronto, ON",                "280"},
                {"Cinder Block Studios",     "65 Industrial Way, Detroit, MI",              "140"},
                {"Indigo Rooftop",           "1 Sky Tower, Manhattan, NY",                  "160"},
                {"Beacon Hill Library",      "210 Beacon Hill Road, Cambridge, MA",         "100"},
                {"Pioneer Square Plaza",     "55 Yesler Way, Seattle, WA",                  "300"},
                {"Sandstone Auditorium",     "404 Mesa Boulevard, Santa Fe, NM",            "250"},
                {"Granite Peak Lodge",       "770 Summit Drive, Aspen, CO",                 "180"},
                {"Lakeshore Convention Bay", "1212 Lakeshore East, Chicago, IL",            "500"},
                {"Bayou Bistro Hall",        "300 Decatur Street, New Orleans, LA",         "210"},
                {"Verdant Greenhouse",       "88 Botanic Way, Asheville, NC",               "130"},
        };

        int added = 0;
        for (String[] row : data) {
            if (venueRepository.count() >= TARGET_VENUES) break;
            boolean exists = venueRepository.findByNameContainingIgnoreCase(row[0]).stream()
                    .anyMatch(v -> v.getName().equalsIgnoreCase(row[0]));
            if (exists) continue;

            venueRepository.save(Venue.builder()
                    .name(row[0])
                    .location(row[1])
                    .capacity(Integer.parseInt(row[2]))
                    .build());
            added++;
        }
        log.info("Venues top-up: added {} (total now {})", added, venueRepository.count());
    }

    // -----------------------------------------------------------------
    // Events – round-robin assignment so organizers are evenly loaded
    // -----------------------------------------------------------------

    private void seedEvents() {
        long current = eventRepository.count();
        if (current >= TARGET_EVENTS) {
            log.info("Events table already has {} rows, skipping top-up", current);
            return;
        }

        List<User> organizers = userRepository.findByRole(Role.ORGANIZER);
        if (organizers.isEmpty()) {
            log.warn("No ORGANIZER users present; can't seed events");
            return;
        }
        List<Venue> venues = venueRepository.findAll();
        if (venues.isEmpty()) {
            log.warn("No venues present; can't seed events");
            return;
        }

        // Pre-count existing events per organizer so the top-up pushes
        // toward an even per-organizer total instead of just round-robin
        // on the *new* additions.
        Map<Long, Long> eventsByOrganizer = new HashMap<>();
        for (User o : organizers) {
            eventsByOrganizer.put(o.getId(), 0L);
        }
        for (Event e : eventRepository.findAll()) {
            if (e.getOrganizer() != null) {
                eventsByOrganizer.merge(e.getOrganizer().getId(), 1L, Long::sum);
            }
        }

        String[][] data = {
                {"Frontend Performance Workshop",   "Practical patterns for fast React apps."},
                {"Cloud Native Day",                "Containers, Kubernetes, and observability."},
                {"AI Tooling Summit",               "Hands-on with the latest agentic dev tools."},
                {"Design Systems Meetup",           "Tokens, primitives, and shipping at scale."},
                {"Mobile Engineering Crash Course", "iOS + Android architecture deep dives."},
                {"Open Source Saturday",            "Pair on real OSS issues with maintainers."},
                {"Data Engineering Forum",          "From CDC pipelines to lakehouse patterns."},
                {"Security Hardening Bootcamp",     "Threat modeling and incident response drills."},
                {"Founders & Funders Mixer",        "Early-stage demo night and casual networking."},
                {"Accessibility-First UX Lab",      "Designing experiences that work for everyone."},
                {"DevOps Office Hours",             "Bring a pipeline, leave with a fix."},
                {"Live Coding Game Jam",            "48-hour game jam, all skill levels welcome."},
                {"Product Discovery Workshop",      "Interview techniques and continuous discovery."},
                {"GraphQL in Production",           "Schemas, federation, and observability."},
                {"Rust Systems Day",                "Low-level patterns and async runtimes."},
                {"Distributed Tracing Deep Dive",   "From OTLP collectors to flame graphs."},
                {"Edge Computing Showcase",         "Workers, KV stores, and global routing."},
                {"WebAssembly Lab",                 "Compiling Rust/Go to Wasm for the browser."},
                {"Postgres Performance Clinic",     "EXPLAIN, indexes, and pg_stat detective work."},
                {"Frontend Animation Jam",          "Motion, spring physics, and choreography."},
                {"Mentorship Roundtable",           "Junior to senior, both ways."},
                {"Container Security Workshop",     "SBOMs, signing, runtime policies."},
                {"Quarterly Retro & Roadmap",       "Looking back, planning forward."},
                {"Hack Night: AI Agents",           "Build a tool-using agent in 3 hours."},
                {"Inclusive Design Symposium",      "Practices for building for everyone."},
                {"Cloud Cost Optimization Clinic",  "Right-size, autoscale, save."},
                {"Developer Wellbeing Forum",       "Pace, focus, and sustainable craft."},
                {"Cybersecurity Tabletop Drill",    "Practice an incident, end to end."},
                {"Hardware Hackers Showcase",       "Soldering, prototypes, weird ideas."},
                {"Tech Writers Workshop",           "Docs that engineers actually read."},
        };

        int eventsToAdd = (int) Math.max(0, TARGET_EVENTS - current);
        LocalDateTime base = LocalDateTime.now().plusDays(2).withSecond(0).withNano(0);

        int added = 0;
        int titleIdx = 0;
        int venueIdx = 0;
        for (int i = 0; i < data.length && added < eventsToAdd; i++) {
            String title = data[titleIdx++ % data.length][0];
            String description = data[(titleIdx - 1) % data.length][1];

            // Pick the organizer with the fewest events so far -> spreads
            // ownership evenly across the whole roster.
            User organizer = organizers.stream()
                    .min(Comparator.comparingLong(o -> eventsByOrganizer.getOrDefault(o.getId(), 0L)))
                    .orElse(organizers.get(0));

            Venue venue = venues.get(venueIdx++ % venues.size());
            LocalDateTime when = base.plusDays(i * 2L)
                    .withHour(18 - (i % 6))
                    .withMinute((i * 15) % 60);

            Event e = Event.builder()
                    .title(title)
                    .description(description)
                    .dateTime(when)
                    .organizer(organizer)
                    .venue(venue)
                    .capacity(venue.getCapacity())
                    .status(EventStatus.SCHEDULED)
                    .build();
            eventRepository.save(e);
            eventsByOrganizer.merge(organizer.getId(), 1L, Long::sum);
            added++;
        }
        log.info("Events top-up: added {} (total now {})", added, eventRepository.count());
    }

    // -----------------------------------------------------------------
    // Event ownership rebalancer
    // -----------------------------------------------------------------

    /**
     * Hands events off from heavily-loaded organizers to lightly-loaded
     * ones until every organizer is within 1 event of every other. Only
     * moves SCHEDULED events that the new owner is allowed to manage
     * (i.e. any of them, since they're SCHEDULED and untouched by the
     * service-layer ownership checks).
     */
    private void rebalanceEventOwnership() {
        List<User> organizers = userRepository.findByRole(Role.ORGANIZER);
        if (organizers.size() < 2) return;

        Map<Long, List<Event>> byOrganizer = new HashMap<>();
        for (User o : organizers) {
            byOrganizer.put(o.getId(), new ArrayList<>());
        }
        for (Event e : eventRepository.findAll()) {
            if (e.getOrganizer() != null) {
                byOrganizer.computeIfAbsent(e.getOrganizer().getId(), k -> new ArrayList<>()).add(e);
            }
        }

        int moves = 0;
        while (true) {
            Long maxId = null;
            Long minId = null;
            int maxSize = Integer.MIN_VALUE;
            int minSize = Integer.MAX_VALUE;
            for (User o : organizers) {
                int size = byOrganizer.getOrDefault(o.getId(), List.of()).size();
                if (size > maxSize) { maxSize = size; maxId = o.getId(); }
                if (size < minSize) { minSize = size; minId = o.getId(); }
            }
            if (maxId == null || minId == null || maxSize - minSize <= 1) break;

            final Long heavyId = maxId;
            final Long lightId = minId;
            List<Event> heavy = byOrganizer.get(heavyId);
            Event toMove = heavy.remove(heavy.size() - 1);
            User newOwner = organizers.stream()
                    .filter(o -> o.getId().equals(lightId))
                    .findFirst()
                    .orElseThrow();
            toMove.setOrganizer(newOwner);
            eventRepository.save(toMove);
            byOrganizer.get(lightId).add(toMove);
            moves++;
        }
        if (moves > 0) {
            log.info("Rebalanced event ownership: {} events moved", moves);
        }
    }

    // -----------------------------------------------------------------
    // Bookings – round-robin so users are evenly loaded; some cancellations
    // -----------------------------------------------------------------

    private void seedBookings() {
        long current = bookingRepository.count();

        List<User> bookers = userRepository.findByRole(Role.USER);
        if (bookers.isEmpty()) {
            log.warn("No USER-role users present; can't seed bookings");
            return;
        }

        List<Event> futureEvents = new ArrayList<>();
        for (Event e : eventRepository.findAll()) {
            if (e.getStatus() == EventStatus.SCHEDULED
                    && e.getDateTime() != null
                    && e.getDateTime().isAfter(LocalDateTime.now())) {
                futureEvents.add(e);
            }
        }
        if (futureEvents.isEmpty()) {
            log.warn("No future SCHEDULED events present; can't seed bookings");
            return;
        }

        // Pre-count existing bookings per user so we keep loading the
        // least-loaded user each iteration. This keeps the histogram of
        // bookings/user roughly flat instead of clustering on the first
        // few users in the list.
        Map<Long, Long> bookingsByUser = new HashMap<>();
        for (User u : bookers) {
            bookingsByUser.put(u.getId(), 0L);
        }
        for (Booking b : bookingRepository.findAll()) {
            if (b.getUser() != null) {
                bookingsByUser.merge(b.getUser().getId(), 1L, Long::sum);
            }
        }

        // Two reasons to top up:
        //   (a) global row count is below TARGET_BOOKINGS
        //   (b) at least one user is below MIN_BOOKINGS_PER_USER
        long byTarget = Math.max(0L, TARGET_BOOKINGS - current);
        long byFloor = bookers.stream()
                .mapToLong(u -> Math.max(0L,
                        MIN_BOOKINGS_PER_USER - bookingsByUser.getOrDefault(u.getId(), 0L)))
                .sum();
        long needed = Math.max(byTarget, byFloor);
        if (needed == 0) {
            log.info("Bookings table already has {} rows and every user is at floor; skipping",
                    current);
            return;
        }

        int added = 0;
        int cancelledInBatch = 0;
        int eventIdx = 0;

        // For each new booking we add it to the *single* least-loaded user.
        // This pulls newcomers up to parity with the historical heavies
        // instead of just round-robining and preserving the skew.
        while (added < needed) {
            User leastLoaded = bookers.stream()
                    .min(Comparator.comparingLong(u -> bookingsByUser.getOrDefault(u.getId(), 0L)))
                    .orElse(null);
            if (leastLoaded == null) break;

            // Walk through the events list until we find one that this
            // user hasn't already booked and that still has free capacity.
            Event chosen = null;
            for (int probe = 0; probe < futureEvents.size(); probe++) {
                Event candidate = futureEvents.get((eventIdx + probe) % futureEvents.size());
                if (bookingRepository.findByUserIdAndEventId(leastLoaded.getId(), candidate.getId()).isPresent()) {
                    continue;
                }
                long active = bookingRepository.countByEventIdAndStatus(
                        candidate.getId(), BookingStatus.BOOKED);
                if (candidate.getCapacity() != null && active >= candidate.getCapacity()) {
                    continue;
                }
                chosen = candidate;
                eventIdx = (eventIdx + probe + 1) % futureEvents.size();
                break;
            }
            if (chosen == null) {
                // This user can't be booked into anything else: mark them
                // "full" by inflating their count so the next iteration
                // picks somebody else. Stop once everyone is exhausted.
                bookingsByUser.merge(leastLoaded.getId(), Long.MAX_VALUE / 2, Long::sum);
                boolean anyAvailable = bookers.stream()
                        .anyMatch(u -> bookingsByUser.getOrDefault(u.getId(), 0L) < Long.MAX_VALUE / 4);
                if (!anyAvailable) {
                    log.info("Bookings top-up stopped early: every user × event slot is taken or full");
                    break;
                }
                continue;
            }

            // ~15% of new bookings get marked CANCELLED so the
            // "Cancelled" tab and admin views have something to show.
            BookingStatus status = (added > 0 && cancelledInBatch * 100L / Math.max(1, added) < 15)
                    ? (added % 7 == 0 ? BookingStatus.CANCELLED : BookingStatus.BOOKED)
                    : BookingStatus.BOOKED;

            if (status == BookingStatus.CANCELLED) {
                cancelledInBatch++;
            }

            bookingRepository.save(Booking.builder()
                    .user(leastLoaded)
                    .event(chosen)
                    .status(status)
                    .build());
            bookingsByUser.merge(leastLoaded.getId(), 1L, Long::sum);
            added++;
        }

        log.info("Bookings top-up: added {} ({} cancelled, total now {})",
                added, cancelledInBatch, bookingRepository.count());
        logBookingDistribution(bookers, bookingsByUser);
    }

    private void logBookingDistribution(List<User> users, Map<Long, Long> counts) {
        StringBuilder sb = new StringBuilder("Booking distribution: ");
        users.stream()
                .sorted(Comparator.comparing(User::getId))
                .forEach(u -> sb.append(u.getName())
                        .append('=')
                        .append(Objects.requireNonNullElse(counts.get(u.getId()), 0L))
                        .append(' '));
        log.info(sb.toString().trim());
    }
}
