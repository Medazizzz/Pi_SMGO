package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.ReservationPaymentCheckoutRequestDTO;
import com.example.contentmanagement.dto.ReservationPaymentCheckoutResponseDTO;
import com.example.contentmanagement.dto.ReservationRequestDTO;
import com.example.contentmanagement.dto.ReservationResponseDTO;
import com.example.contentmanagement.dto.SeanceOccupancyTemporalSnapshotDTO;
import com.example.contentmanagement.dto.SeanceOccupancyTrainingSampleDTO;
import com.example.contentmanagement.dto.WaitlistJoinRequestDTO;
import com.example.contentmanagement.dto.WaitlistJoinResponseDTO;
import com.example.contentmanagement.entity.Cinema;
import com.example.contentmanagement.entity.Reservation;
import com.example.contentmanagement.entity.Salle;
import com.example.contentmanagement.entity.Seance;
import com.example.contentmanagement.entity.SeanceOccupancyTemporalSnapshot;
import com.example.contentmanagement.entity.SeanceOccupancyTrainingSample;
import com.example.contentmanagement.entity.WaitlistEntry;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.exception.DuplicateResourceException;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.CinemaRepository;
import com.example.contentmanagement.repository.ReservationRepository;
import com.example.contentmanagement.repository.SalleRepository;
import com.example.contentmanagement.repository.SeanceOccupancyTemporalSnapshotRepository;
import com.example.contentmanagement.repository.SeanceOccupancyTrainingSampleRepository;
import com.example.contentmanagement.repository.SeanceRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.repository.WaitlistEntryRepository;
import com.example.contentmanagement.service.NotificationService;
import com.example.contentmanagement.service.ReservationService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationServiceImpl implements ReservationService {

    private static final String STATUS_CONFIRMED = "CONFIRMEE";
    private static final String STATUS_COMPLETED = "TERMINEE";
    private static final String STATUS_PENDING_PAYMENT = "PENDING_PAYMENT";
    private static final Set<String> STATUS_CANCELLED = Set.of("ANNULEE", "ANNULE", "CANCELLED", "CANCELED", "CANCEL");
    private static final Set<String> STATUS_NO_SHOW = Set.of("NO_SHOW", "NOSHOW", "ABSENT");
    private static final String DEFAULT_COUNTRY_CODE = "TN";
        private static final Set<LocalDate> HOLIDAYS_TN = Set.of(
            LocalDate.of(2026, 1, 1),
            LocalDate.of(2026, 3, 20),
            LocalDate.of(2026, 4, 9),
            LocalDate.of(2026, 5, 1),
            LocalDate.of(2026, 7, 25),
            LocalDate.of(2026, 10, 15)
        );
        private static final Set<LocalDate> HOLIDAYS_FR = Set.of(
            LocalDate.of(2026, 1, 1),
            LocalDate.of(2026, 5, 1),
            LocalDate.of(2026, 5, 8),
            LocalDate.of(2026, 7, 14),
            LocalDate.of(2026, 11, 11),
            LocalDate.of(2026, 12, 25)
        );
        private static final Map<String, Set<LocalDate>> HOLIDAYS_BY_COUNTRY = Map.of(
            "TN", HOLIDAYS_TN,
            "FR", HOLIDAYS_FR
        );
        private static final Set<LocalDateRange> SCHOOL_VACATIONS_TN = Set.of(
            new LocalDateRange(LocalDate.of(2026, 1, 2), LocalDate.of(2026, 1, 12)),
            new LocalDateRange(LocalDate.of(2026, 3, 15), LocalDate.of(2026, 3, 25)),
            new LocalDateRange(LocalDate.of(2026, 6, 15), LocalDate.of(2026, 9, 10))
        );
        private static final Set<LocalDateRange> SCHOOL_VACATIONS_FR = Set.of(
            new LocalDateRange(LocalDate.of(2026, 2, 7), LocalDate.of(2026, 3, 8)),
            new LocalDateRange(LocalDate.of(2026, 4, 4), LocalDate.of(2026, 5, 3)),
            new LocalDateRange(LocalDate.of(2026, 7, 5), LocalDate.of(2026, 9, 1))
        );
        private static final Map<String, Set<LocalDateRange>> SCHOOL_VACATIONS_BY_COUNTRY = Map.of(
            "TN", SCHOOL_VACATIONS_TN,
            "FR", SCHOOL_VACATIONS_FR
        );
    private static final List<Integer> SNAPSHOT_HORIZON_HOURS = Arrays.asList(24, 6, 1);
    private static final int HISTORY_WINDOW_SIZE = 10;

    private final ReservationRepository reservationRepository;
    private final SeanceRepository seanceRepository;
    private final CinemaRepository cinemaRepository;
    private final SalleRepository salleRepository;
    private final SeanceOccupancyTemporalSnapshotRepository seanceOccupancyTemporalSnapshotRepository;
    private final SeanceOccupancyTrainingSampleRepository seanceOccupancyTrainingSampleRepository;
    private final WaitlistEntryRepository waitlistEntryRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Value("${app.payment.stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${app.payment.default-success-url:http://localhost:4200/admin/cinema?module=reservations&paymentSuccess=1}")
    private String defaultSuccessUrl;

    @Value("${app.payment.default-cancel-url:http://localhost:4200/admin/cinema?module=reservations&paymentCanceled=1}")
    private String defaultCancelUrl;

    @Override
    public ReservationResponseDTO create(ReservationRequestDTO request) {
        List<String> seatNumbers = resolveSeatNumbers(request);
        ensureSessionHasCapacityOrThrow(request.getSeanceId());
        ensureSeatsAreAvailable(request.getSeanceId(), seatNumbers, null, null);

        Reservation reservation = Reservation.builder()
                .seanceId(request.getSeanceId())
                .userId(request.getUserId())
                .numeroPlace(seatNumbers.get(0))
                .numeroPlaces(seatNumbers)
                .prix(request.getPrix())
                .contenuId(request.getContenuId())
                .watchPartyId(request.getWatchPartyId())
                .salleId(request.getSalleId())
                .dateReservation(new Date())
                .statut(STATUS_CONFIRMED)
                .build();

        return enrich(toResponse(reservationRepository.save(reservation)), reservation.getSeanceId());
    }

    @Override
    public ReservationResponseDTO findById(String id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        return enrich(toResponse(reservation), reservation.getSeanceId());
    }

    @Override
    public List<ReservationResponseDTO> findAll() {
        return reservationRepository.findAll().stream()
                .map(reservation -> enrich(toResponse(reservation), reservation.getSeanceId()))
                .toList();
    }

    @Override
    public List<ReservationResponseDTO> findByUserId(String userId) {
        return reservationRepository.findByUserId(userId).stream()
                .map(reservation -> enrich(toResponse(reservation), reservation.getSeanceId()))
                .toList();
    }

    @Override
    public List<ReservationResponseDTO> findBySeanceId(String seanceId) {
        return reservationRepository.findBySeanceId(seanceId).stream()
                .map(reservation -> enrich(toResponse(reservation), reservation.getSeanceId()))
                .toList();
    }

    @Override
    public ReservationResponseDTO update(String id, ReservationRequestDTO request) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));

        List<String> seatNumbers = resolveSeatNumbers(request);
        ensureSeatsAreAvailable(request.getSeanceId(), seatNumbers, reservation.getUserId(), id);

        reservation.setSeanceId(request.getSeanceId());
        reservation.setUserId(request.getUserId());
        reservation.setNumeroPlace(seatNumbers.get(0));
        reservation.setNumeroPlaces(seatNumbers);
        reservation.setPrix(request.getPrix());
        reservation.setContenuId(request.getContenuId());
        reservation.setWatchPartyId(request.getWatchPartyId());
        reservation.setSalleId(request.getSalleId());
        return enrich(toResponse(reservationRepository.save(reservation)), reservation.getSeanceId());
    }

    @Override
    public void deleteById(String id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        reservationRepository.delete(reservation);
        notifyWaitlistIfSeatAvailable(reservation.getSeanceId());
    }

    @Override
    public void processExpiredReservations() {
        Date now = new Date();

        List<Reservation> expiredPendingReservations = reservationRepository.findByStatutAndExpiresAtBefore(STATUS_PENDING_PAYMENT, now);
        if (!expiredPendingReservations.isEmpty()) {
            Set<String> releasedSeances = new HashSet<>();
            expiredPendingReservations.stream()
                    .map(Reservation::getSeanceId)
                    .filter(value -> value != null && !value.isBlank())
                    .forEach(releasedSeances::add);
            reservationRepository.deleteAll(expiredPendingReservations);
            releasedSeances.forEach(this::notifyWaitlistIfSeatAvailable);
        }

        List<Reservation> reservations = reservationRepository.findAll();
        LocalDateTime nowDateTime = LocalDateTime.now();

        for (Reservation reservation : reservations) {
            if (!STATUS_CONFIRMED.equalsIgnoreCase(reservation.getStatut())) {
                continue;
            }

            Seance seance = seanceRepository.findById(reservation.getSeanceId()).orElse(null);
            if (seance == null || seance.getDateSeance() == null || seance.getHeureSeance() == null) {
                continue;
            }

            LocalDateTime seanceDateTime = LocalDateTime.of(seance.getDateSeance(), java.time.LocalTime.parse(seance.getHeureSeance()));
            if (seanceDateTime.isBefore(nowDateTime)) {
                reservation.setStatut(STATUS_COMPLETED);
                reservationRepository.save(reservation);
            }
        }
    }

    @Override
    public List<ReservationResponseDTO> searchReservationsByKeyword(String keyword) {
        List<Reservation> reservations = reservationRepository.findReservationsWithDetailsByKeyword(keyword);
        return reservations.stream()
                .map(reservation -> enrich(toResponse(reservation), reservation.getSeanceId()))
                .toList();
    }

    @Override
    public ReservationPaymentCheckoutResponseDTO createPaymentCheckoutSession(ReservationPaymentCheckoutRequestDTO request) {
        if (request == null || request.getReservation() == null) {
            throw new IllegalArgumentException("Reservation payload is required.");
        }

        ReservationRequestDTO reservationRequest = request.getReservation();
        validateReservationRequest(reservationRequest);

        List<String> seatNumbers = resolveSeatNumbers(reservationRequest);
        ensureSessionHasCapacityOrThrow(reservationRequest.getSeanceId());
        ensureSeatsAreAvailable(reservationRequest.getSeanceId(), seatNumbers, null, null);

        String successUrl = appendCheckoutSessionToken(resolveUrlOrDefault(request.getSuccessUrl(), defaultSuccessUrl));
        String cancelUrl = resolveUrlOrDefault(request.getCancelUrl(), defaultCancelUrl);
        double totalPrice = reservationRequest.getPrix() * seatNumbers.size();
        String joinedSeats = String.join(",", seatNumbers);

        if (isStripeNotConfigured()) {
            String sessionId = "mock_" + UUID.randomUUID();
            Reservation hold = createPendingReservationHold(reservationRequest, seatNumbers, totalPrice, sessionId);
            return ReservationPaymentCheckoutResponseDTO.builder()
                    .sessionId(sessionId)
                    .checkoutUrl(successUrl.replace("{CHECKOUT_SESSION_ID}", sessionId))
                    .expiresAt(hold.getExpiresAt())
                    .build();
        }

        try {
            SessionCreateParams params = buildCheckoutSessionParams(reservationRequest, successUrl, cancelUrl, totalPrice, joinedSeats);
            Stripe.apiKey = stripeSecretKey;
            Session session = Session.create(params);
            Reservation hold = createPendingReservationHold(reservationRequest, seatNumbers, totalPrice, session.getId());
            return ReservationPaymentCheckoutResponseDTO.builder()
                    .sessionId(session.getId())
                    .checkoutUrl(session.getUrl())
                    .expiresAt(hold.getExpiresAt())
                    .build();
        } catch (StripeException ex) {
            throw new IllegalStateException("Unable to create Stripe checkout session: " + ex.getMessage(), ex);
        }
    }

    @Override
    public ReservationResponseDTO confirmPaymentAndCreateReservation(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("sessionId is required.");
        }

        Reservation reservation = reservationRepository.findByPaymentSessionId(sessionId).stream()
                .filter(item -> STATUS_PENDING_PAYMENT.equalsIgnoreCase(item.getStatut()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Invalid or expired checkout session."));

        if (reservation.getExpiresAt() != null && reservation.getExpiresAt().before(new Date())) {
            String seanceId = reservation.getSeanceId();
            reservationRepository.delete(reservation);
            notifyWaitlistIfSeatAvailable(seanceId);
            throw new IllegalStateException("Payment window expired. Seats have been released.");
        }

        if (!sessionId.startsWith("mock_")) {
            ensureStripeConfigured();
            try {
                Stripe.apiKey = stripeSecretKey;
                Session session = Session.retrieve(sessionId);
                if (!"paid".equalsIgnoreCase(session.getPaymentStatus())) {
                    throw new IllegalStateException("Payment is not completed for this session.");
                }
            } catch (StripeException ex) {
                throw new IllegalStateException("Unable to confirm Stripe checkout session: " + ex.getMessage(), ex);
            }
        }

        reservation.setStatut(STATUS_CONFIRMED);
        reservation.setExpiresAt(null);
        return enrich(toResponse(reservationRepository.save(reservation)), reservation.getSeanceId());
    }

    @Override
    public WaitlistJoinResponseDTO joinWaitlist(WaitlistJoinRequestDTO request) {
        if (request == null || request.getSeanceId() == null || request.getSeanceId().isBlank()) {
            throw new IllegalArgumentException("seanceId is required.");
        }

        if (!isSessionFull(request.getSeanceId())) {
            throw new IllegalStateException("Seats are currently available. Please reserve directly.");
        }

        String email = resolveWaitlistEmail(request);
        String userId = request.getUserId() != null && !request.getUserId().isBlank() ? request.getUserId().trim() : null;

        WaitlistEntry existingUserEntry = null;
        if (userId != null) {
            existingUserEntry = waitlistEntryRepository
                .findFirstBySeanceIdAndUserIdAndActiveTrue(request.getSeanceId(), userId)
                .orElse(null);
        }
        WaitlistEntry existingEmailEntry = waitlistEntryRepository
            .findFirstBySeanceIdAndEmailAndActiveTrue(request.getSeanceId(), email)
            .orElse(null);

        if (existingUserEntry != null) {
            existingUserEntry.setEmail(email);
            existingUserEntry.setNotified(false);
            waitlistEntryRepository.save(existingUserEntry);

            List<WaitlistEntry> entries = waitlistEntryRepository.findBySeanceIdAndActiveTrueOrderByCreatedAtAsc(request.getSeanceId());
            int position = findWaitlistPosition(entries, existingUserEntry.getId());
            return WaitlistJoinResponseDTO.builder()
                .waitlistEntryId(existingUserEntry.getId())
                .seanceId(existingUserEntry.getSeanceId())
                .email(existingUserEntry.getEmail())
                .position(position)
                .message("You are already in waitlist. Notification email updated.")
                .build();
        }

        if (existingEmailEntry != null) {
            if (userId != null && (existingEmailEntry.getUserId() == null || existingEmailEntry.getUserId().isBlank())) {
            existingEmailEntry.setUserId(userId);
            waitlistEntryRepository.save(existingEmailEntry);
            }

            List<WaitlistEntry> entries = waitlistEntryRepository.findBySeanceIdAndActiveTrueOrderByCreatedAtAsc(request.getSeanceId());
            int position = findWaitlistPosition(entries, existingEmailEntry.getId());
            return WaitlistJoinResponseDTO.builder()
                .waitlistEntryId(existingEmailEntry.getId())
                .seanceId(existingEmailEntry.getSeanceId())
                .email(existingEmailEntry.getEmail())
                .position(position)
                .message("Email is already in waitlist. Your position is kept.")
                .build();
        }

        WaitlistEntry waitlistEntry = WaitlistEntry.builder()
                .seanceId(request.getSeanceId())
            .userId(userId)
                .email(email)
                .createdAt(LocalDateTime.now())
                .active(true)
                .notified(false)
                .build();
        waitlistEntry = waitlistEntryRepository.save(waitlistEntry);

        int position = waitlistEntryRepository.findBySeanceIdAndActiveTrueOrderByCreatedAtAsc(request.getSeanceId()).size();
        return WaitlistJoinResponseDTO.builder()
                .waitlistEntryId(waitlistEntry.getId())
                .seanceId(waitlistEntry.getSeanceId())
                .email(waitlistEntry.getEmail())
                .position(position)
                .message("Added to waitlist successfully.")
                .build();
    }

    @Override
    public List<SeanceOccupancyTrainingSampleDTO> rebuildFinalOccupancyTrainingDataset() {
        LocalDateTime now = LocalDateTime.now();
        List<SeanceOccupancyTrainingSample> samples = new ArrayList<>();

        for (Seance seance : seanceRepository.findAll()) {
            LocalDateTime seanceDateTime = resolveSeanceDateTime(seance);
            if (seanceDateTime == null || seanceDateTime.isAfter(now)) {
                continue;
            }

            int capacity = resolveSeanceCapacity(seance);
            if (capacity <= 0) {
                continue;
            }

            int soldSeats = countFinalSoldSeats(seance.getId());
            double tauxRemplissageFinal = (soldSeats * 100.0) / capacity;

            SeanceOccupancyTrainingSample sample = SeanceOccupancyTrainingSample.builder()
                    .seanceId(seance.getId())
                    .cinemaId(seance.getCinemaId())
                    .salleId(seance.getSalle())
                    .contenuId(seance.getContenuId())
                    .dateSeance(seance.getDateSeance())
                    .heureSeance(seance.getHeureSeance())
                    .salleCapacity(capacity)
                    .soldSeats(soldSeats)
                    .tauxRemplissageFinal(tauxRemplissageFinal)
                    .generatedAt(now)
                    .build();

            samples.add(sample);
        }

        seanceOccupancyTrainingSampleRepository.deleteAll();
        List<SeanceOccupancyTrainingSample> savedSamples = seanceOccupancyTrainingSampleRepository.saveAll(samples);

        return savedSamples.stream()
                .map(this::toTrainingSampleDto)
                .toList();
    }

    @Override
    public List<SeanceOccupancyTrainingSampleDTO> findFinalOccupancyTrainingDataset() {
        return seanceOccupancyTrainingSampleRepository.findAll().stream()
                .map(this::toTrainingSampleDto)
                .toList();
    }

    @Override
    public List<SeanceOccupancyTemporalSnapshotDTO> rebuildTemporalSnapshotTrainingDataset() {
        LocalDateTime now = LocalDateTime.now();
        List<SeanceOccupancyTemporalSnapshot> snapshots = new ArrayList<>();
        List<Seance> allSeances = seanceRepository.findAll();
        List<SeanceFinalOccupancy> historicalFinalOccupancies = buildSeanceFinalOccupancies(allSeances, now);

        for (Seance seance : allSeances) {
            LocalDateTime seanceDateTime = resolveSeanceDateTime(seance);
            if (seanceDateTime == null || seanceDateTime.isAfter(now)) {
                continue;
            }

            int capacity = resolveSeanceCapacity(seance);
            if (capacity <= 0) {
                continue;
            }

            List<Reservation> seanceReservations = reservationRepository.findBySeanceId(seance.getId());
            int soldSeatsFinal = countFinalSoldSeats(seanceReservations);
            double tauxRemplissageFinal = (soldSeatsFinal * 100.0) / capacity;
            HistoricalAverages historicalAverages = computeHistoricalAverages(seance, seanceDateTime, historicalFinalOccupancies);
            CalendarFeatures calendarFeatures = buildCalendarFeatures(seance.getDateSeance(), resolveCountryCodeForSeance(seance));

            for (Integer horizonHours : SNAPSHOT_HORIZON_HOURS) {
                LocalDateTime snapshotAt = seanceDateTime.minusHours(horizonHours);
                int seatsReservedAtSnapshot = countReservedSeatsAtSnapshot(seanceReservations, snapshotAt);
                double tauxRemplissageSnapshot = (seatsReservedAtSnapshot * 100.0) / capacity;

                SeanceOccupancyTemporalSnapshot snapshot = SeanceOccupancyTemporalSnapshot.builder()
                        .seanceId(seance.getId())
                        .cinemaId(seance.getCinemaId())
                        .salleId(seance.getSalle())
                        .contenuId(seance.getContenuId())
                        .dateSeance(seance.getDateSeance())
                        .heureSeance(seance.getHeureSeance())
                        .salleCapacity(capacity)
                        .horizonHoursBeforeSeance(horizonHours)
                        .snapshotAt(snapshotAt)
                        .seatsReservedAtSnapshot(seatsReservedAtSnapshot)
                        .tauxRemplissageSnapshot(tauxRemplissageSnapshot)
                        .soldSeatsFinal(soldSeatsFinal)
                        .tauxRemplissageFinal(tauxRemplissageFinal)
                        .historyWindowSize(HISTORY_WINDOW_SIZE)
                        .historyCountCinema(historicalAverages.historyCountCinema)
                        .historyCountSalle(historicalAverages.historyCountSalle)
                        .historyCountCreneau(historicalAverages.historyCountCreneau)
                        .historyCountContenu(historicalAverages.historyCountContenu)
                        .avgTauxRemplissageCinemaLastN(historicalAverages.avgCinema)
                        .avgTauxRemplissageSalleLastN(historicalAverages.avgSalle)
                        .avgTauxRemplissageCreneauLastN(historicalAverages.avgCreneau)
                        .avgTauxRemplissageContenuLastN(historicalAverages.avgContenu)
                        .dayOfWeek(calendarFeatures.getDayOfWeek())
                        .isWeekend(calendarFeatures.getIsWeekend())
                        .isHoliday(calendarFeatures.getIsHoliday())
                        .isSchoolVacation(calendarFeatures.getIsSchoolVacation())
                        .isBeforeHoliday(calendarFeatures.getIsBeforeHoliday())
                        .month(calendarFeatures.getMonth())
                        .season(calendarFeatures.getSeason())
                        .generatedAt(now)
                        .build();

                snapshots.add(snapshot);
            }
        }

        seanceOccupancyTemporalSnapshotRepository.deleteAll();
        List<SeanceOccupancyTemporalSnapshot> saved = seanceOccupancyTemporalSnapshotRepository.saveAll(snapshots);
        return saved.stream()
                .map(this::toTemporalSnapshotDto)
                .toList();
    }

    @Override
    public List<SeanceOccupancyTemporalSnapshotDTO> findTemporalSnapshotTrainingDataset() {
        return seanceOccupancyTemporalSnapshotRepository.findAll().stream()
                .map(this::toTemporalSnapshotDto)
                .toList();
    }

    private int findWaitlistPosition(List<WaitlistEntry> entries, String entryId) {
        for (int i = 0; i < entries.size(); i++) {
            if (entryId.equals(entries.get(i).getId())) {
                return i + 1;
            }
        }
        return entries.size();
    }

    private LocalDateTime resolveSeanceDateTime(Seance seance) {
        if (seance == null || seance.getDateSeance() == null || seance.getHeureSeance() == null) {
            return null;
        }

        try {
            return LocalDateTime.of(seance.getDateSeance(), LocalTime.parse(seance.getHeureSeance()));
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private int resolveSeanceCapacity(Seance seance) {
        if (seance == null || seance.getSalle() == null || seance.getSalle().isBlank()) {
            return 0;
        }

        return salleRepository.findById(seance.getSalle())
                .or(() -> salleRepository.findByNameIgnoreCase(seance.getSalle()))
                .map(Salle::getCapacity)
                .orElse(0);
    }

    private int countFinalSoldSeats(String seanceId) {
        return countFinalSoldSeats(reservationRepository.findBySeanceId(seanceId));
    }

    private int countFinalSoldSeats(List<Reservation> reservations) {
        Set<String> soldSeats = new HashSet<>();
        for (Reservation reservation : reservations) {
            if (!isReservationSoldForFinalMetrics(reservation)) {
                continue;
            }
            soldSeats.addAll(reservationSeats(reservation));
        }
        return soldSeats.size();
    }

    private int countReservedSeatsAtSnapshot(List<Reservation> reservations, LocalDateTime snapshotAt) {
        Set<String> reservedSeats = new HashSet<>();
        for (Reservation reservation : reservations) {
            LocalDateTime reservationDateTime = toLocalDateTime(reservation.getDateReservation());
            if (reservationDateTime != null && reservationDateTime.isAfter(snapshotAt)) {
                continue;
            }

            if (!isReservationActiveAtSnapshot(reservation, snapshotAt)) {
                continue;
            }

            reservedSeats.addAll(reservationSeats(reservation));
        }

        return reservedSeats.size();
    }

    private boolean isReservationActiveAtSnapshot(Reservation reservation, LocalDateTime snapshotAt) {
        if (isCancelledStatus(reservation.getStatut()) || isNoShowStatus(reservation.getStatut())) {
            return false;
        }

        if (isSoldFinalStatus(reservation.getStatut())) {
            return true;
        }

        if (isPendingStatus(reservation.getStatut())) {
            return !isPendingExpiredAt(reservation, snapshotAt);
        }

        return false;
    }

    private boolean isReservationSoldForFinalMetrics(Reservation reservation) {
        String status = reservation.getStatut();
        return isSoldFinalStatus(status)
                && !isCancelledStatus(status)
                && !isNoShowStatus(status);
    }

    private boolean isSoldFinalStatus(String status) {
        String normalized = normalizeStatus(status);
        return STATUS_CONFIRMED.equals(normalized) || STATUS_COMPLETED.equals(normalized);
    }

    private boolean isPendingStatus(String status) {
        return STATUS_PENDING_PAYMENT.equals(normalizeStatus(status));
    }

    private boolean isCancelledStatus(String status) {
        return STATUS_CANCELLED.contains(normalizeStatus(status));
    }

    private boolean isNoShowStatus(String status) {
        return STATUS_NO_SHOW.contains(normalizeStatus(status));
    }

    private boolean isPendingExpiredAt(Reservation reservation, LocalDateTime referenceTime) {
        if (!isPendingStatus(reservation.getStatut())) {
            return false;
        }

        LocalDateTime expiresAtDateTime = toLocalDateTime(reservation.getExpiresAt());
        return expiresAtDateTime != null && !expiresAtDateTime.isAfter(referenceTime);
    }

    private String normalizeStatus(String status) {
        if (status == null) {
            return "";
        }
        return status.trim()
                .toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');
    }

    private LocalDateTime toLocalDateTime(Date value) {
        if (value == null) {
            return null;
        }
        return LocalDateTime.ofInstant(value.toInstant(), ZoneId.systemDefault());
    }

    private SeanceOccupancyTemporalSnapshotDTO toTemporalSnapshotDto(SeanceOccupancyTemporalSnapshot snapshot) {
        return SeanceOccupancyTemporalSnapshotDTO.builder()
                .seanceId(snapshot.getSeanceId())
                .cinemaId(snapshot.getCinemaId())
                .salleId(snapshot.getSalleId())
                .contenuId(snapshot.getContenuId())
                .dateSeance(snapshot.getDateSeance())
                .heureSeance(snapshot.getHeureSeance())
                .salleCapacity(snapshot.getSalleCapacity())
                .horizonHoursBeforeSeance(snapshot.getHorizonHoursBeforeSeance())
                .snapshotAt(snapshot.getSnapshotAt())
                .seatsReservedAtSnapshot(snapshot.getSeatsReservedAtSnapshot())
                .tauxRemplissageSnapshot(snapshot.getTauxRemplissageSnapshot())
                .soldSeatsFinal(snapshot.getSoldSeatsFinal())
                .tauxRemplissageFinal(snapshot.getTauxRemplissageFinal())
                .historyWindowSize(snapshot.getHistoryWindowSize())
                .historyCountCinema(snapshot.getHistoryCountCinema())
                .historyCountSalle(snapshot.getHistoryCountSalle())
                .historyCountCreneau(snapshot.getHistoryCountCreneau())
                .historyCountContenu(snapshot.getHistoryCountContenu())
                .avgTauxRemplissageCinemaLastN(snapshot.getAvgTauxRemplissageCinemaLastN())
                .avgTauxRemplissageSalleLastN(snapshot.getAvgTauxRemplissageSalleLastN())
                .avgTauxRemplissageCreneauLastN(snapshot.getAvgTauxRemplissageCreneauLastN())
                .avgTauxRemplissageContenuLastN(snapshot.getAvgTauxRemplissageContenuLastN())
                .dayOfWeek(snapshot.getDayOfWeek())
                .isWeekend(snapshot.getIsWeekend())
                .isHoliday(snapshot.getIsHoliday())
                .isSchoolVacation(snapshot.getIsSchoolVacation())
                .isBeforeHoliday(snapshot.getIsBeforeHoliday())
                .month(snapshot.getMonth())
                .season(snapshot.getSeason())
                .generatedAt(snapshot.getGeneratedAt())
                .build();
    }

    private List<SeanceFinalOccupancy> buildSeanceFinalOccupancies(List<Seance> seances, LocalDateTime now) {
        List<SeanceFinalOccupancy> result = new ArrayList<>();
        for (Seance seance : seances) {
            LocalDateTime seanceDateTime = resolveSeanceDateTime(seance);
            if (seanceDateTime == null || seanceDateTime.isAfter(now)) {
                continue;
            }

            int capacity = resolveSeanceCapacity(seance);
            if (capacity <= 0) {
                continue;
            }

            int soldSeatsFinal = countFinalSoldSeats(seance.getId());
            double tauxRemplissageFinal = (soldSeatsFinal * 100.0) / capacity;

            result.add(new SeanceFinalOccupancy(
                    seance.getId(),
                    seance.getCinemaId(),
                    seance.getSalle(),
                    seance.getContenuId(),
                    seance.getHeureSeance(),
                    seanceDateTime,
                    tauxRemplissageFinal
            ));
        }
        return result;
    }

    private HistoricalAverages computeHistoricalAverages(
            Seance currentSeance,
            LocalDateTime currentSeanceDateTime,
            List<SeanceFinalOccupancy> historicalFinalOccupancies
    ) {
        List<SeanceFinalOccupancy> previousSeances = historicalFinalOccupancies.stream()
                .filter(item -> !Objects.equals(item.seanceId, currentSeance.getId()))
                .filter(item -> item.seanceDateTime.isBefore(currentSeanceDateTime))
                .toList();

        List<SeanceFinalOccupancy> byCinema = takeLastN(previousSeances.stream()
                .filter(item -> Objects.equals(item.cinemaId, currentSeance.getCinemaId()))
                .toList(), HISTORY_WINDOW_SIZE);

        List<SeanceFinalOccupancy> bySalle = takeLastN(previousSeances.stream()
                .filter(item -> Objects.equals(item.salleId, currentSeance.getSalle()))
                .toList(), HISTORY_WINDOW_SIZE);

        List<SeanceFinalOccupancy> byCreneau = takeLastN(previousSeances.stream()
                .filter(item -> Objects.equals(item.heureSeance, currentSeance.getHeureSeance()))
                .toList(), HISTORY_WINDOW_SIZE);

        List<SeanceFinalOccupancy> byContenu = takeLastN(previousSeances.stream()
                .filter(item -> Objects.equals(item.contenuId, currentSeance.getContenuId()))
                .toList(), HISTORY_WINDOW_SIZE);

        return new HistoricalAverages(
                averageTaux(byCinema),
                averageTaux(bySalle),
                averageTaux(byCreneau),
                averageTaux(byContenu),
                byCinema.size(),
                bySalle.size(),
                byCreneau.size(),
                byContenu.size()
        );
    }

    private List<SeanceFinalOccupancy> takeLastN(List<SeanceFinalOccupancy> values, int n) {
        return values.stream()
                .sorted(Comparator.comparing((SeanceFinalOccupancy item) -> item.seanceDateTime).reversed())
                .limit(n)
                .toList();
    }

    private double averageTaux(List<SeanceFinalOccupancy> values) {
        if (values.isEmpty()) {
            return 0.0;
        }
        return values.stream()
                .mapToDouble(item -> item.tauxRemplissageFinal)
                .average()
                .orElse(0.0);
    }

    private static class SeanceFinalOccupancy {
        private final String seanceId;
        private final String cinemaId;
        private final String salleId;
        private final String contenuId;
        private final String heureSeance;
        private final LocalDateTime seanceDateTime;
        private final double tauxRemplissageFinal;

        private SeanceFinalOccupancy(
                String seanceId,
                String cinemaId,
                String salleId,
                String contenuId,
                String heureSeance,
                LocalDateTime seanceDateTime,
                double tauxRemplissageFinal
        ) {
            this.seanceId = seanceId;
            this.cinemaId = cinemaId;
            this.salleId = salleId;
            this.contenuId = contenuId;
            this.heureSeance = heureSeance;
            this.seanceDateTime = seanceDateTime;
            this.tauxRemplissageFinal = tauxRemplissageFinal;
        }
    }

    private static class HistoricalAverages {
        private final double avgCinema;
        private final double avgSalle;
        private final double avgCreneau;
        private final double avgContenu;
        private final int historyCountCinema;
        private final int historyCountSalle;
        private final int historyCountCreneau;
        private final int historyCountContenu;

        private HistoricalAverages(
                double avgCinema,
                double avgSalle,
                double avgCreneau,
                double avgContenu,
                int historyCountCinema,
                int historyCountSalle,
                int historyCountCreneau,
                int historyCountContenu
        ) {
            this.avgCinema = avgCinema;
            this.avgSalle = avgSalle;
            this.avgCreneau = avgCreneau;
            this.avgContenu = avgContenu;
            this.historyCountCinema = historyCountCinema;
            this.historyCountSalle = historyCountSalle;
            this.historyCountCreneau = historyCountCreneau;
            this.historyCountContenu = historyCountContenu;
        }
    }

    private SeanceOccupancyTrainingSampleDTO toTrainingSampleDto(SeanceOccupancyTrainingSample sample) {
        return SeanceOccupancyTrainingSampleDTO.builder()
                .seanceId(sample.getSeanceId())
                .cinemaId(sample.getCinemaId())
                .salleId(sample.getSalleId())
                .contenuId(sample.getContenuId())
                .dateSeance(sample.getDateSeance())
                .heureSeance(sample.getHeureSeance())
                .salleCapacity(sample.getSalleCapacity())
                .soldSeats(sample.getSoldSeats())
                .tauxRemplissageFinal(sample.getTauxRemplissageFinal())
                .generatedAt(sample.getGeneratedAt())
                .build();
    }

    private ReservationResponseDTO toResponse(Reservation reservation) {
        return ReservationResponseDTO.builder()
                .id(reservation.getId())
                .seanceId(reservation.getSeanceId())
                .dateReservation(reservation.getDateReservation())
                .numeroPlace(reservation.getNumeroPlace())
                .numeroPlaces(reservation.getNumeroPlaces())
                .statut(reservation.getStatut())
                .prix(reservation.getPrix())
                .userId(reservation.getUserId())
                .contenuId(reservation.getContenuId())
                .salleId(reservation.getSalleId())
                .paymentSessionId(reservation.getPaymentSessionId())
                .expiresAt(reservation.getExpiresAt())
                .build();
    }

    private ReservationResponseDTO enrich(ReservationResponseDTO dto, String seanceId) {
        if (seanceId == null) {
            return dto;
        }

        Seance seance = seanceRepository.findById(seanceId).orElse(null);
        if (seance == null) {
            return dto;
        }

        dto.setDateSeance(seance.getDateSeance());
        dto.setHeureSeance(seance.getHeureSeance());

        if (seance.getCinemaId() != null) {
            cinemaRepository.findById(seance.getCinemaId()).map(Cinema::getNom).ifPresent(dto::setNomCinema);
        }
        if (seance.getSalle() != null) {
            salleRepository.findById(seance.getSalle()).map(Salle::getName).ifPresent(dto::setNumeroSalle);
        }
        if (dto.getUserId() != null) {
            userRepository.findById(dto.getUserId())
                    .map(this::resolveUserDisplayName)
                    .ifPresent(dto::setUserName);
        }
        return dto;
    }

    private String resolveUserDisplayName(User user) {
        if (user == null) {
            return null;
        }

        String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
        String fullName = (firstName + " " + lastName).trim();
        if (!fullName.isBlank()) {
            return fullName;
        }

        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }

        return user.getId();
    }

    private void validateReservationRequest(ReservationRequestDTO request) {
        if (request.getSeanceId() == null || request.getSeanceId().isBlank()) {
            throw new IllegalArgumentException("seanceId is required.");
        }
        if (request.getUserId() == null || request.getUserId().isBlank()) {
            throw new IllegalArgumentException("userId is required.");
        }
        List<String> seatNumbers = resolveSeatNumbers(request);
        if (seatNumbers.isEmpty()) {
            throw new IllegalArgumentException("numeroPlace is required.");
        }
        if (request.getPrix() <= 0) {
            throw new IllegalArgumentException("prix must be greater than 0.");
        }
    }

    private List<String> resolveSeatNumbers(ReservationRequestDTO request) {
        LinkedHashSet<String> uniqueSeats = new LinkedHashSet<>();
        if (request.getNumeroPlaces() != null) {
            request.getNumeroPlaces().stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(String::trim)
                    .forEach(uniqueSeats::add);
        }

        if (uniqueSeats.isEmpty() && request.getNumeroPlace() != null && !request.getNumeroPlace().isBlank()) {
            for (String seat : request.getNumeroPlace().split(",")) {
                String trimmed = seat.trim();
                if (!trimmed.isEmpty()) {
                    uniqueSeats.add(trimmed);
                }
            }
        }

        return new ArrayList<>(uniqueSeats);
    }

    private void ensureSeatsAreAvailable(String seanceId, List<String> seatNumbers, String sameUserId, String excludeReservationId) {
        if (seatNumbers == null || seatNumbers.isEmpty()) {
            throw new IllegalArgumentException("numeroPlace is required.");
        }

        List<Reservation> reservations = reservationRepository.findBySeanceId(seanceId);
        for (String seatNumber : seatNumbers) {
            boolean occupied = reservations.stream().anyMatch(existingReservation ->
                    isSeatBlocking(existingReservation, sameUserId, excludeReservationId, seatNumber));
            if (occupied) {
                throw new DuplicateResourceException("Cette place est déjà réservée pour cette séance.");
            }
        }
    }

    private boolean isSeatBlocking(Reservation reservation, String sameUserId, String excludeReservationId, String seatNumber) {
        if (excludeReservationId != null && excludeReservationId.equals(reservation.getId())) {
            return false;
        }

        if (isCancelledStatus(reservation.getStatut()) || isNoShowStatus(reservation.getStatut())) {
            return false;
        }

        if (isPendingExpiredAt(reservation, LocalDateTime.now())) {
            return false;
        }

        if (sameUserId != null && sameUserId.equals(reservation.getUserId())) {
            return false;
        }

        return reservationSeats(reservation).contains(seatNumber);
    }

    private List<String> reservationSeats(Reservation reservation) {
        LinkedHashSet<String> seats = new LinkedHashSet<>();
        if (reservation.getNumeroPlaces() != null) {
            reservation.getNumeroPlaces().stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(String::trim)
                    .forEach(seats::add);
        }
        if (seats.isEmpty() && reservation.getNumeroPlace() != null && !reservation.getNumeroPlace().isBlank()) {
            for (String seat : reservation.getNumeroPlace().split(",")) {
                String trimmed = seat.trim();
                if (!trimmed.isEmpty()) {
                    seats.add(trimmed);
                }
            }
        }
        return new ArrayList<>(seats);
    }

    private SessionCreateParams buildCheckoutSessionParams(ReservationRequestDTO reservationRequest, String successUrl, String cancelUrl, double totalPrice, String joinedSeats) {
        return SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("eur")
                                                .setUnitAmount(Math.round(totalPrice * 100))
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Cinema reservation - seats " + joinedSeats)
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .putMetadata("seanceId", reservationRequest.getSeanceId())
                .putMetadata("userId", reservationRequest.getUserId())
                .putMetadata("numeroPlace", joinedSeats)
                .putMetadata("numeroPlaces", joinedSeats)
                .putMetadata("prix", String.valueOf(totalPrice))
                .putMetadata("contenuId", nullToEmpty(reservationRequest.getContenuId()))
                .putMetadata("watchPartyId", nullToEmpty(reservationRequest.getWatchPartyId()))
                .putMetadata("salleId", nullToEmpty(reservationRequest.getSalleId()))
                .build();
    }

    private Reservation createPendingReservationHold(ReservationRequestDTO reservationRequest, List<String> seatNumbers, double totalPrice, String paymentSessionId) {
        Reservation reservation = Reservation.builder()
                .seanceId(reservationRequest.getSeanceId())
                .userId(reservationRequest.getUserId())
                .numeroPlace(seatNumbers.get(0))
                .numeroPlaces(seatNumbers)
                .prix(totalPrice)
                .contenuId(reservationRequest.getContenuId())
                .watchPartyId(reservationRequest.getWatchPartyId())
                .salleId(reservationRequest.getSalleId())
                .dateReservation(new Date())
                .statut(STATUS_PENDING_PAYMENT)
                .paymentSessionId(paymentSessionId)
                .expiresAt(new Date(System.currentTimeMillis() + 5 * 60 * 1000L))
                .build();
        return reservationRepository.save(reservation);
    }

    private void ensureSessionHasCapacityOrThrow(String seanceId) {
        if (isSessionFull(seanceId)) {
            throw new DuplicateResourceException("Session is full. Join the waitlist to be notified when a seat is free.");
        }
    }

    private boolean isSessionFull(String seanceId) {
        int capacity = resolveSessionCapacity(seanceId);
        if (capacity <= 0) {
            return false;
        }

        Set<String> occupiedSeats = new HashSet<>();
        for (Reservation reservation : reservationRepository.findBySeanceId(seanceId)) {
            if (!isReservationBlockingSeatNow(reservation)) {
                continue;
            }
            occupiedSeats.addAll(reservationSeats(reservation));
        }

        return occupiedSeats.size() >= capacity;
    }

    private boolean isReservationBlockingSeatNow(Reservation reservation) {
        if (isCancelledStatus(reservation.getStatut()) || isNoShowStatus(reservation.getStatut())) {
            return false;
        }

        if (isPendingStatus(reservation.getStatut())) {
            return !isPendingExpiredAt(reservation, LocalDateTime.now());
        }

        return isSoldFinalStatus(reservation.getStatut());
    }

    private int resolveSessionCapacity(String seanceId) {
        Seance seance = seanceRepository.findById(seanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Seance not found with id: " + seanceId));
        if (seance.getSalle() == null || seance.getSalle().isBlank()) {
            return 0;
        }
        return salleRepository.findById(seance.getSalle())
                .or(() -> salleRepository.findByNameIgnoreCase(seance.getSalle()))
                .map(Salle::getCapacity)
                .orElse(0);
    }

    private String resolveWaitlistEmail(WaitlistJoinRequestDTO request) {
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            return request.getEmail().trim();
        }

        if (request.getUserId() != null && !request.getUserId().isBlank()) {
            return userRepository.findById(request.getUserId())
                    .map(user -> user.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));
        }

        throw new IllegalArgumentException("email or userId is required for waitlist registration.");
    }

    private void notifyWaitlistIfSeatAvailable(String seanceId) {
        if (seanceId == null || seanceId.isBlank() || isSessionFull(seanceId)) {
            return;
        }

        List<WaitlistEntry> entries = waitlistEntryRepository.findBySeanceIdAndActiveTrueOrderByCreatedAtAsc(seanceId);
        if (entries.isEmpty()) {
            return;
        }

        for (WaitlistEntry entry : entries) {
            try {
                notificationService.sendEmail(
                        entry.getEmail(),
                        "Seat available for your session",
                        "A seat is now available for session " + seanceId + ". You can reserve now."
                );
                entry.setNotified(true);
                entry.setActive(false);
                waitlistEntryRepository.save(entry);
                return;
            } catch (Exception ex) {
                log.warn("Waitlist email send failed for entry {} (seance {}). Keeping entry active.", entry.getId(), seanceId, ex);
            }
        }
    }

    private void ensureStripeConfigured() {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new IllegalStateException("Payment provider is not configured.");
        }
    }

    private boolean isStripeNotConfigured() {
        return stripeSecretKey == null || stripeSecretKey.isBlank();
    }

    private String resolveUrlOrDefault(String candidate, String fallback) {
        if (candidate == null || candidate.isBlank()) {
            return fallback;
        }
        return candidate;
    }

    private String appendCheckoutSessionToken(String successUrl) {
        if (successUrl.contains("{CHECKOUT_SESSION_ID}")) {
            return successUrl;
        }
        if (successUrl.contains("?")) {
            return successUrl + "&sessionId={CHECKOUT_SESSION_ID}";
        }
        return successUrl + "?sessionId={CHECKOUT_SESSION_ID}";
    }

    private CalendarFeatures buildCalendarFeatures(LocalDate date, String countryCode) {
        if (date == null) {
            throw new IllegalArgumentException("date is required.");
        }

        String normalizedCountry = normalizeCountryCode(countryCode);
        int dayOfWeek = date.getDayOfWeek().getValue();
        int month = date.getMonthValue();

        boolean isHoliday = isHoliday(date, normalizedCountry);
        boolean isSchoolVacation = isSchoolVacation(date, normalizedCountry);
        boolean isBeforeHoliday = isHoliday(date.plusDays(1), normalizedCountry);
        boolean isWeekend = date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY;

        return new CalendarFeatures(
                dayOfWeek,
                isWeekend ? 1 : 0,
                isHoliday ? 1 : 0,
                isSchoolVacation ? 1 : 0,
                isBeforeHoliday ? 1 : 0,
                month,
                resolveSeason(month)
        );
    }

    private boolean isHoliday(LocalDate date, String countryCode) {
        return HOLIDAYS_BY_COUNTRY
                .getOrDefault(countryCode, Set.of())
                .contains(date);
    }

    private boolean isSchoolVacation(LocalDate date, String countryCode) {
        return SCHOOL_VACATIONS_BY_COUNTRY
                .getOrDefault(countryCode, Set.of())
                .stream()
                .anyMatch(range -> range.contains(date));
    }

    private String normalizeCountryCode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return DEFAULT_COUNTRY_CODE;
        }
        return countryCode.trim().toUpperCase();
    }

    private String resolveCountryCodeForSeance(Seance seance) {
        return DEFAULT_COUNTRY_CODE;
    }

    private double estimateBasePrice(Seance seance, List<Reservation> reservations) {
        if (reservations.isEmpty()) {
            return 20.0;
        }
        double average = reservations.stream()
                .mapToDouble(Reservation::getPrix)
                .average()
                .orElse(20.0);
        return Math.max(10.0, average);
    }

    private double estimateCurrentPrice(List<Reservation> reservations, double basePrice) {
        if (reservations.isEmpty()) {
            return basePrice;
        }
        double recent = reservations.stream()
                .sorted((a, b) -> b.getDateReservation().compareTo(a.getDateReservation()))
                .limit(5)
                .mapToDouble(Reservation::getPrix)
                .average()
                .orElse(basePrice);
        return recent > 0 ? recent : basePrice;
    }

    private double predictOccupancy(Seance seance, double currentOccupancy) {
        LocalDateTime seanceDateTime = resolveSeanceDateTime(seance);
        if (seanceDateTime == null) {
            return currentOccupancy;
        }

        long hoursUntilSeance = java.time.temporal.ChronoUnit.HOURS.between(LocalDateTime.now(), seanceDateTime);

        if (hoursUntilSeance > 72) {
            return currentOccupancy + (Math.random() * 30);
        } else if (hoursUntilSeance > 24) {
            return currentOccupancy + (Math.random() * 20);
        } else {
            return currentOccupancy + (Math.random() * 10);
        }
    }

    private String resolveSeason(int month) {
        if (month == 12 || month == 1 || month == 2) {
            return "WINTER";
        }
        if (month >= 3 && month <= 5) {
            return "SPRING";
        }
        if (month >= 6 && month <= 8) {
            return "SUMMER";
        }
        return "AUTUMN";
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String emptyToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }

    private static class LocalDateRange {
        private final LocalDate start;
        private final LocalDate end;

        private LocalDateRange(LocalDate start, LocalDate end) {
            this.start = start;
            this.end = end;
        }

        private boolean contains(LocalDate date) {
            return (date.isEqual(start) || date.isAfter(start))
                    && (date.isEqual(end) || date.isBefore(end));
        }
    }

    private static class CalendarFeatures {
        private final int dayOfWeek;
        private final int isWeekend;
        private final int isHoliday;
        private final int isSchoolVacation;
        private final int isBeforeHoliday;
        private final int month;
        private final String season;

        private CalendarFeatures(
                int dayOfWeek,
                int isWeekend,
                int isHoliday,
                int isSchoolVacation,
                int isBeforeHoliday,
                int month,
                String season
        ) {
            this.dayOfWeek = dayOfWeek;
            this.isWeekend = isWeekend;
            this.isHoliday = isHoliday;
            this.isSchoolVacation = isSchoolVacation;
            this.isBeforeHoliday = isBeforeHoliday;
            this.month = month;
            this.season = season;
        }

        public int getDayOfWeek() {
            return dayOfWeek;
        }

        public int getIsWeekend() {
            return isWeekend;
        }

        public int getIsHoliday() {
            return isHoliday;
        }

        public int getIsSchoolVacation() {
            return isSchoolVacation;
        }

        public int getIsBeforeHoliday() {
            return isBeforeHoliday;
        }

        public int getMonth() {
            return month;
        }

        public String getSeason() {
            return season;
        }
    }
}
