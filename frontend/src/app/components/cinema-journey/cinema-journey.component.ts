import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Ticket, MapPin, Calendar, RefreshCw, Armchair, Film } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, interval } from 'rxjs';
import * as QRCode from 'qrcode';
import {
  CinemaApiService,
  CinemaResponseDTO,
  ReservationPaymentCheckoutRequestDTO,
  ReservationRequestDTO,
  ReservationResponseDTO,
  SalleResponseDTO,
  SeanceResponseDTO,
  WaitlistJoinRequestDTO,
} from '../../services/cinema-api.service';
import { AuthService } from '../../services/auth.service';

type SarraModule = 'cinema' | 'sessions' | 'halls' | 'reservations';
type MockPaymentMethod = 'card' | 'paypal';

type PendingReservationBatch = {
  userId: string;
  userName?: string;
  seanceId: string;
  seats: string[];
  pricePerSeat: number;
  totalPrice: number;
  sessionLabel: string;
  expiresAt: number;
};

type SeatMapSeat = {
  id: string;
  reserved: boolean;
  selected: boolean;
};

type SeatMapRow = {
  label: string;
  seats: SeatMapSeat[];
};

type GeoPoint = {
  lat: number;
  lon: number;
};

type CinemaLocation = CinemaResponseDTO & {
  latitude: number;
  longitude: number;
  distanceKm: number;
  displayName: string;
};

@Component({
  selector: 'app-cinema-journey',
  standalone: true,
  imports: [CommonModule, FormsModule, KeyValuePipe],
  templateUrl: './cinema-journey.component.html',
  styleUrls: ['./cinema-journey.component.css'],
})
export class CinemaJourneyComponent implements OnInit {
  private readonly pendingReservationStorageKey = 'pendingReservationBatch';
  private readonly hallLayoutOverridesKey = 'hall-layout-overrides';
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);

  readonly TicketIcon = Ticket;
  readonly MapPinIcon = MapPin;
  readonly CalendarIcon = Calendar;
  readonly RefreshIcon = RefreshCw;
  readonly SeatIcon = Armchair;
  readonly FilmIcon = Film;

  activeModule: SarraModule = 'cinema';
  cinemas: CinemaResponseDTO[] = [];
  nearestCinema: CinemaLocation | null = null;
  nearestCinemaMapUrl: SafeResourceUrl | null = null;
  nearestCinemaDirectionsUrl = '';
  nearestCinemaCandidates: CinemaLocation[] = [];
  userLocation: GeoPoint | null = null;
  locatingNearestCinema = false;
  salles: SalleResponseDTO[] = [];
  seances: SeanceResponseDTO[] = [];
  seancesGroupedByCinema: { [cinemaName: string]: SeanceResponseDTO[] } = {};
  reservations: ReservationResponseDTO[] = [];

  loading = false;
  loadingReservations = false;
  selectedCinemaId = '';
  selectedSeanceId = '';
  selectedSessionReservedSeats: string[] = [];
  reservationSearchTerm = '';
  searchedReservations: ReservationResponseDTO[] = [];
  isSearchingReservations = false;
  selectedSessionCapacity = 0;
  selectedSessionRowCount = 0;
  selectedSessionSeatsPerRow = 0;
  seatMapRows: SeatMapRow[] = [];
  selectedSeatNumbers: string[] = [];
  ticketReservation: ReservationResponseDTO | null = null;
  showTicketModal = false;
  ticketQrCodeDataUrl = '';
  currentUserId = '';
  currentUserName = '';
  numeroPlace = '';
  prix = 25;
  editingReservationId: string | null = null;
  editingReservationSeat = '';
  showMockPaymentPanel = false;
  mockPaymentMethod: MockPaymentMethod = 'card';
  mockCardHolder = '';
  mockCardNumber = '';
  mockCardExpiry = '';
  mockCardCvv = '';
  mockPaypalEmail = '';
  pendingMockSessionId = '';
  pendingMockPayment: PendingReservationBatch | null = null;
  paymentHoldSecondsRemaining = 0;
  private paymentHoldTimerId: number | null = null;
  showWaitlistSuggestion = false;
  waitlistJoinLoading = false;
  waitlistEmail = '';
  showEditReservationModal = false;
  editReservationId = '';
  editReservationUserId = '';
  editReservationSeanceId = '';
  editReservationSeat = '';
  editReservationPrice = 25;
  reservationMessage = '';
  error = '';
  sessionSearch = '';

  constructor(
    private readonly cinemaApi: CinemaApiService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.resolveCurrentUserId();
    this.currentUserName = this.resolveCurrentUserName();
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUserId = user?.userId ?? this.resolveCurrentUserId();
        this.currentUserName = user?.username ?? this.resolveCurrentUserName();
        if (this.activeModule === 'reservations' && this.currentUserId) {
          this.loadUserReservations();
        }
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const requestedModule = (params.get('module') as SarraModule | null) ?? 'cinema';
        this.activeModule = ['cinema', 'sessions', 'halls', 'reservations'].includes(requestedModule)
          ? requestedModule
          : 'cinema';

        const sessionId = params.get('sessionId');
        const paymentSuccess = params.get('paymentSuccess') === '1';
        if (sessionId && paymentSuccess) {
          this.confirmReservationPayment(sessionId);
          return;
        }

        if (params.get('paymentCanceled') === '1') {
          this.reservationMessage = 'Payment was canceled.';
        }

        this.loadActiveModule();
      });

    fromEvent(window, 'focus')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.activeModule === 'cinema' || this.activeModule === 'sessions') {
          this.refreshCinemaData();
        }
      });

    fromEvent<StorageEvent>(window, 'storage')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.key === 'cinemas-updated' && (this.activeModule === 'cinema' || this.activeModule === 'sessions')) {
          this.refreshCinemaData();
        }
      });

    interval(15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.activeModule === 'cinema' || this.activeModule === 'sessions') {
          this.refreshCinemaData();
        }
      });
  }

  refreshCinemaData(): void {
    this.loading = true;
    this.error = '';

    this.cinemaApi.getCinemas().subscribe({
      next: (cinemas) => {
        this.cinemas = cinemas;
        this.loadSalles();
        this.loadSeancesForSelection();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.getErrorMessage(err, 'Failed to load cinemas.');
      },
    });
  }

  async findNearestCinema(): Promise<void> {
    this.error = '';
    this.locatingNearestCinema = true;
    this.nearestCinema = null;
    this.nearestCinemaMapUrl = null;
    this.nearestCinemaDirectionsUrl = '';

    try {
      this.userLocation = await this.getUserLocation();
      const cinemasWithLocation = await Promise.allSettled(
        this.cinemas.map((cinema) => this.resolveCinemaLocation(cinema, this.userLocation as GeoPoint))
      );

      this.nearestCinemaCandidates = cinemasWithLocation
        .filter((item): item is PromiseFulfilledResult<CinemaLocation | null> => item.status === 'fulfilled')
        .map((item) => item.value)
        .filter((item): item is CinemaLocation => item !== null)
        .sort((left, right) => left.distanceKm - right.distanceKm);

      this.nearestCinema = this.nearestCinemaCandidates[0] ?? null;
      if (this.nearestCinema) {
        this.nearestCinemaMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.buildMapEmbedUrl(this.nearestCinema.latitude, this.nearestCinema.longitude)
        );
        this.nearestCinemaDirectionsUrl = this.buildDirectionsUrl(
          this.userLocation,
          this.nearestCinema.latitude,
          this.nearestCinema.longitude
        );
      } else {
        this.error = 'Impossible de localiser un cinéma avec les données actuelles. Vérifie les adresses et les villes enregistrées.';
      }
    } catch (err: unknown) {
      this.error = this.getErrorMessage(err, 'Unable to determine your location or nearest cinema.');
    } finally {
      this.locatingNearestCinema = false;
    }
  }

  loadHalls(): void {
    this.loading = true;
    this.error = '';

    this.cinemaApi.getSalles().subscribe({
      next: (salles) => {
        this.salles = salles;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.getErrorMessage(err, 'Failed to load halls.');
      },
    });
  }

  loadReservationsModule(): void {
    this.refreshCinemaData();
    if (this.currentUserId.trim()) {
      this.loadUserReservations();
    }
    if (this.selectedSeanceId) {
      this.loadSessionReservations(this.selectedSeanceId);
    }
  }

  onCinemaChange(): void {
    this.loadSeancesForSelection();
  }

  onSelectedReservationSessionChange(): void {
    if (!this.selectedSeanceId) {
      this.selectedSessionReservedSeats = [];
      this.selectedSessionCapacity = 0;
      this.selectedSessionRowCount = 0;
      this.selectedSessionSeatsPerRow = 0;
      this.selectedSeatNumbers = [];
      this.numeroPlace = '';
      this.seatMapRows = [];
      this.showWaitlistSuggestion = false;
      return;
    }
    this.selectedSeatNumbers = [];
    this.numeroPlace = '';
    this.showWaitlistSuggestion = false;
    this.loadSessionReservations(this.selectedSeanceId);
  }

  loadUserReservations(): void {
    if (!this.currentUserId.trim()) {
      this.reservationMessage = 'Please log in to view your reservations.';
      return;
    }

    this.loadingReservations = true;
    this.reservationMessage = '';

    this.cinemaApi.getReservationsByUser(this.currentUserId.trim()).subscribe({
      next: (data) => {
        this.reservations = data;
        this.loadingReservations = false;
      },
      error: (err: unknown) => {
        this.loadingReservations = false;
        this.reservationMessage = this.getErrorMessage(err, 'Failed to load your reservations.');
      },
    });
  }

  searchReservations(): void {
    if (!this.reservationSearchTerm.trim()) {
      this.searchedReservations = [];
      return;
    }

    this.isSearchingReservations = true;
    this.reservationMessage = '';

    this.cinemaApi.searchReservations(this.reservationSearchTerm.trim()).subscribe({
      next: (reservations) => {
        this.searchedReservations = reservations;
        this.isSearchingReservations = false;
      },
      error: (err: unknown) => {
        this.isSearchingReservations = false;
        this.reservationMessage = this.getErrorMessage(err, 'Failed to search reservations.');
      },
    });
  }

  private loadSalles(): void {
    this.cinemaApi.getSalles().subscribe({
      next: (salles) => {
        this.salles = salles;
        if (this.activeModule === 'reservations' && this.selectedSeanceId) {
          this.loadSessionReservations(this.selectedSeanceId);
        }
      },
      error: (err: unknown) => {
        this.error = this.getErrorMessage(err, 'Failed to load halls.');
      },
    });
  }

  private async getUserLocation(): Promise<GeoPoint> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser.');
    }

    return await new Promise<GeoPoint>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(error.message || 'Geolocation request failed.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        }
      );
    });
  }

  private async resolveCinemaLocation(cinema: CinemaResponseDTO, userLocation: GeoPoint): Promise<CinemaLocation | null> {
    const queries = [
      [cinema.nom, cinema.adresse, cinema.ville],
      [cinema.nom, cinema.ville],
      [cinema.adresse, cinema.ville],
      [cinema.ville],
    ]
      .map((parts) => parts.filter(Boolean).join(', '))
      .filter((query, index, allQueries) => query.trim().length > 0 && allQueries.indexOf(query) === index);

    for (const query of queries) {
      const resolved = await this.fetchCinemaCoordinates(query);
      if (!resolved) {
        continue;
      }

      return {
        ...cinema,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        distanceKm: this.haversineDistanceKm(userLocation.lat, userLocation.lon, resolved.latitude, resolved.longitude),
        displayName: resolved.displayName,
      };
    }

    return null;
  }

  private async fetchCinemaCoordinates(query: string): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const match = results[0];
    if (!match) {
      return null;
    }

    const latitude = Number(match.lat);
    const longitude = Number(match.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      latitude,
      longitude,
      displayName: match.display_name,
    };
  }

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;
    const toRadians = (value: number): number => (value * Math.PI) / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private buildMapEmbedUrl(latitude: number, longitude: number): string {
    const delta = 0.03;
    const left = longitude - delta;
    const right = longitude + delta;
    const top = latitude + delta;
    const bottom = latitude - delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  }

  private buildDirectionsUrl(userLocation: GeoPoint | null, latitude: number, longitude: number): string {
    if (!userLocation) {
      return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`;
    }

    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation.lat}%2C${userLocation.lon}%3B${latitude}%2C${longitude}`;
  }

  private loadSessionReservations(seanceId: string): void {
    this.cinemaApi.getReservationsBySeance(seanceId).subscribe({
      next: (reservations) => {
        this.selectedSessionReservedSeats = Array.from(new Set(reservations
          .flatMap((reservation) => {
            if (reservation.numeroPlaces && reservation.numeroPlaces.length > 0) {
              return reservation.numeroPlaces;
            }
            return reservation.numeroPlace
              ? reservation.numeroPlace.split(',').map((seat) => seat.trim()).filter((seat) => seat.length > 0)
              : [];
          })));
        const selectedSeance = this.seances.find((item) => item.id === seanceId);
        const selectedSalle = selectedSeance ? this.findSalleForSeance(selectedSeance) : undefined;
        const overrideLayout = this.resolveHallLayoutOverride(selectedSeance?.numeroSalle ?? selectedSalle?.name ?? '');
        this.selectedSessionRowCount = selectedSalle?.rowCount ?? overrideLayout?.rowCount ?? 0;
        this.selectedSessionSeatsPerRow = selectedSalle?.seatsPerRow ?? overrideLayout?.seatsPerRow ?? 0;
        this.selectedSessionCapacity = this.selectedSessionRowCount > 0 && this.selectedSessionSeatsPerRow > 0
          ? this.selectedSessionRowCount * this.selectedSessionSeatsPerRow
          : (selectedSalle?.capacity ?? 0);
        const isSessionFull = this.selectedSessionCapacity > 0
          && this.selectedSessionReservedSeats.length >= this.selectedSessionCapacity;
        this.showWaitlistSuggestion = isSessionFull && !this.editingReservationId;
        if (this.showWaitlistSuggestion && !this.waitlistEmail.trim()) {
          this.waitlistEmail = this.resolveCurrentUserEmail();
        }
        this.selectedSeatNumbers = this.selectedSeatNumbers.filter((seat) => !this.selectedSessionReservedSeats.includes(seat));
        this.syncSeatInputFromSelection();
        this.buildSeatMap();
      },
      error: () => {
        this.selectedSessionReservedSeats = [];
        this.selectedSessionCapacity = 0;
        this.selectedSessionRowCount = 0;
        this.selectedSessionSeatsPerRow = 0;
        this.selectedSeatNumbers = [];
        this.numeroPlace = '';
        this.seatMapRows = [];
        this.showWaitlistSuggestion = false;
      },
    });
  }

  private findSalleForSeance(seance: SeanceResponseDTO): SalleResponseDTO | undefined {
    const seanceSalleId = (seance.salle || '').trim();
    const seanceHallLabel = (seance.numeroSalle || '').trim().toLowerCase();

    return this.salles.find((salle) => {
      const hallId = (salle.id || '').trim();
      const hallName = (salle.name || '').trim().toLowerCase();
      return hallId === seanceSalleId
        || hallId === seance.numeroSalle
        || hallName === seanceHallLabel;
    });
  }

  private resolveHallLayoutOverride(hallName: string): { rowCount: number; seatsPerRow: number } | null {
    const normalizedName = hallName.trim().toLowerCase();
    if (!normalizedName) {
      return null;
    }

    try {
      const raw = localStorage.getItem(this.hallLayoutOverridesKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Record<string, { rowCount: number; seatsPerRow: number }>;
      const layout = parsed[normalizedName];
      if (!layout) {
        return null;
      }

      const rowCount = Number(layout.rowCount);
      const seatsPerRow = Number(layout.seatsPerRow);
      if (rowCount > 0 && seatsPerRow > 0) {
        return { rowCount, seatsPerRow };
      }

      return null;
    } catch {
      return null;
    }
  }

  toggleSeatSelection(seatId: string, reserved: boolean): void {
    if (reserved) {
      return;
    }

    const existingIndex = this.selectedSeatNumbers.indexOf(seatId);
    if (existingIndex >= 0) {
      this.selectedSeatNumbers.splice(existingIndex, 1);
    } else {
      this.selectedSeatNumbers.push(seatId);
    }

    this.syncSeatInputFromSelection();
    this.reservationMessage = '';
  }

  isSeatReserved(seatId: string): boolean {
    return this.selectedSessionReservedSeats.includes(seatId);
  }

  isSeatSelected(seatId: string): boolean {
    return this.selectedSeatNumbers.includes(seatId);
  }

  get availableSeatCount(): number {
    return Math.max(0, this.selectedSessionCapacity - new Set(this.selectedSessionReservedSeats).size);
  }

  cancelReservation(id: string): void {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    this.loading = true;
    this.cinemaApi.deleteReservation(id).subscribe({
      next: () => {
        this.loading = false;
        this.loadUserReservations();
        if (this.selectedSeanceId) {
          this.loadSessionReservations(this.selectedSeanceId);
        }
        if (this.editingReservationId === id) {
          this.resetReservationEditor();
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        this.reservationMessage = this.getErrorMessage(err, 'Failed to cancel reservation.');
      },
    });
  }

  reserveSeat(): void {
    this.showWaitlistSuggestion = false;

    if (!this.selectedSeanceId) {
      this.reservationMessage = 'Select a seance first.';
      return;
    }
    if (!this.currentUserId.trim()) {
      this.reservationMessage = 'Please log in to reserve a seat.';
      return;
    }
    const selectedSeats = this.selectedSeatNumbers.length > 0
      ? [...this.selectedSeatNumbers]
      : this.parseSeatNumbers(this.numeroPlace);
    if (selectedSeats.length === 0) {
      this.reservationMessage = 'At least one seat number is required.';
      return;
    }
    const seatAlreadyReserved = selectedSeats.some((seat) => this.selectedSessionReservedSeats.includes(seat));
    if (seatAlreadyReserved && !(this.editingReservationId && selectedSeats.length === 1 && selectedSeats[0] === this.editingReservationSeat)) {
      this.reservationMessage = 'One or more selected seats are already reserved for this session.';
      return;
    }
    if (this.prix <= 0) {
      this.reservationMessage = 'Price must be greater than 0.';
      return;
    }

    const pricePerSeat = this.prix;
    const totalPrice = pricePerSeat * selectedSeats.length;
    const pendingBatch: PendingReservationBatch = {
      userId: this.currentUserId.trim(),
      userName: this.currentUserName.trim() || this.currentUserId.trim(),
      seanceId: this.selectedSeanceId,
      seats: selectedSeats,
      pricePerSeat,
      totalPrice,
      sessionLabel: this.getSessionLabel(this.selectedSeanceId),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
    this.pendingMockPayment = pendingBatch;

    const payload: ReservationRequestDTO = {
      seanceId: this.selectedSeanceId,
      userId: pendingBatch.userId,
      numeroPlace: selectedSeats[0],
      numeroPlaces: selectedSeats,
      prix: totalPrice,
      salleId: this.selectedSeance?.salle,
    };

    this.loading = true;
    this.reservationMessage = '';

    if (this.editingReservationId) {
      const request$ = this.cinemaApi.updateReservation(this.editingReservationId, payload);

      request$.subscribe({
        next: (reservation) => {
          this.loading = false;
          this.showWaitlistSuggestion = false;
          this.ticketReservation = reservation;
          this.generateTicketQrCode(reservation);
          this.reservationMessage = `Reservation updated: ${reservation.id}`;
          this.resetReservationEditor();
          this.selectedSeatNumbers = [];
          this.numeroPlace = '';
          this.loadUserReservations();
          this.loadSessionReservations(this.selectedSeanceId);
        },
        error: (err: unknown) => {
          this.loading = false;
          this.reservationMessage = this.getErrorMessage(err, 'Reservation update failed.');
        },
      });
      return;
    }

    const paymentPayload: ReservationPaymentCheckoutRequestDTO = {
      reservation: payload,
      successUrl: `${window.location.origin}/user/cinema?module=reservations&paymentSuccess=1`,
      cancelUrl: `${window.location.origin}/user/cinema?module=reservations&paymentCanceled=1`,
    };

    this.cinemaApi.createReservationCheckout(paymentPayload).subscribe({
      next: (checkout) => {
        this.loading = false;
        this.showWaitlistSuggestion = false;
        const backendExpiry = checkout.expiresAt ? new Date(checkout.expiresAt).getTime() : Date.now() + 5 * 60 * 1000;
        const updatedPendingBatch: PendingReservationBatch = {
          ...pendingBatch,
          expiresAt: backendExpiry,
        };
        this.pendingMockPayment = updatedPendingBatch;
        this.savePendingReservationBatch(updatedPendingBatch);

        if (checkout.checkoutUrl && !checkout.sessionId?.startsWith('mock_')) {
          window.location.href = checkout.checkoutUrl;
          return;
        }

        this.resetMockPaymentInputs();
        this.pendingMockSessionId = checkout.sessionId || '';
        this.pendingMockPayment = updatedPendingBatch;
        this.startPaymentHoldCountdown(updatedPendingBatch.expiresAt);
        this.showMockPaymentPanel = true;
      },
      error: (err: unknown) => {
        const backendMessage = this.getErrorMessage(err, 'Failed to start payment checkout.');
        const lowered = backendMessage.toLowerCase();
        if (lowered.includes('stripe is not configured') || lowered.includes('payment provider is not configured')) {
          this.loading = false;
          this.resetMockPaymentInputs();
          const fallbackPendingBatch: PendingReservationBatch = {
            ...pendingBatch,
            userName: pendingBatch.userName || this.currentUserName.trim() || this.currentUserId.trim(),
            expiresAt: Date.now() + 5 * 60 * 1000,
          };
          this.pendingMockSessionId = '';
          this.pendingMockPayment = fallbackPendingBatch;
          this.savePendingReservationBatch(fallbackPendingBatch);
          this.startPaymentHoldCountdown(fallbackPendingBatch.expiresAt);
          this.showMockPaymentPanel = true;
          return;
        }

        this.loading = false;
        this.showWaitlistSuggestion = this.shouldOfferWaitlist(err, backendMessage);
        if (this.showWaitlistSuggestion && !this.waitlistEmail.trim()) {
          this.waitlistEmail = this.resolveCurrentUserEmail();
        }
        this.reservationMessage = this.showWaitlistSuggestion
          ? 'Session is full. You can join the waitlist to be notified when a seat is available.'
          : backendMessage;
      },
    });
  }

  joinWaitlistForCurrentSession(): void {
    if (!this.selectedSeanceId) {
      this.reservationMessage = 'Select a seance first.';
      return;
    }

    const email = this.waitlistEmail.trim();
    if (!this.isValidEmail(email)) {
      this.reservationMessage = 'Please enter a valid email for waitlist notification.';
      return;
    }

    const payload: WaitlistJoinRequestDTO = {
      seanceId: this.selectedSeanceId,
      userId: this.currentUserId?.trim() || undefined,
      email,
    };

    this.waitlistJoinLoading = true;
    this.cinemaApi.joinReservationWaitlist(payload).subscribe({
      next: (response) => {
        this.waitlistJoinLoading = false;
        this.showWaitlistSuggestion = false;
        this.waitlistEmail = '';
        this.reservationMessage = `Waitlist joined successfully. Your position is ${response.position}.`;
      },
      error: (err: unknown) => {
        this.waitlistJoinLoading = false;
        this.reservationMessage = this.getErrorMessage(err, 'Unable to join waitlist.');
      },
    });
  }

  confirmMockPayment(): void {
    if (!this.validateMockPaymentInputs()) {
      return;
    }

    if (!this.pendingMockPayment) {
      this.reservationMessage = 'No pending payment found.';
      return;
    }

    if (this.pendingMockPayment.expiresAt <= Date.now()) {
      this.stopPaymentHoldCountdown();
      this.pendingMockPayment = null;
      this.pendingMockSessionId = '';
      this.clearPendingReservationBatch();
      this.reservationMessage = 'Payment window expired. Seats are available again.';
      return;
    }

    if (this.pendingMockSessionId) {
      this.confirmReservationPayment(this.pendingMockSessionId, true);
      return;
    }

    this.createReservationFromPendingPayment();
  }

  private createReservationFromPendingPayment(): void {
    if (!this.pendingMockPayment) {
      this.reservationMessage = 'No pending payment found.';
      return;
    }

    const payload: ReservationRequestDTO = {
      seanceId: this.pendingMockPayment.seanceId,
      userId: this.pendingMockPayment.userId,
      numeroPlace: this.pendingMockPayment.seats.join(', '),
      numeroPlaces: this.pendingMockPayment.seats,
      prix: this.pendingMockPayment.totalPrice,
      salleId: this.selectedSeance?.salle,
    };

    this.loading = true;
    this.cinemaApi.createReservation(payload).subscribe({
      next: (reservation) => {
        this.loading = false;
        this.showMockPaymentPanel = false;
        this.pendingMockSessionId = '';
        this.pendingMockPayment = null;
        this.stopPaymentHoldCountdown();
        this.clearPendingReservationBatch();
        this.ticketReservation = reservation;
        this.showTicketModal = true;
        this.generateTicketQrCode(reservation);
        this.downloadReservationPdf(reservation);
        this.reservationMessage = `Reservation created: ${reservation.id}`;
        this.resetReservationEditor();
        this.resetMockPaymentInputs();
        this.selectedSeatNumbers = [];
        this.numeroPlace = '';
        this.loadUserReservations();
        this.loadSessionReservations(this.selectedSeanceId);
      },
      error: (err: unknown) => {
        this.loading = false;
        this.reservationMessage = this.getErrorMessage(err, 'Reservation failed.');
      },
    });
  }

  cancelMockPayment(): void {
    this.showMockPaymentPanel = false;
    this.pendingMockSessionId = '';
    this.pendingMockPayment = null;
    this.stopPaymentHoldCountdown();
    this.clearPendingReservationBatch();
    this.resetMockPaymentInputs();
    this.reservationMessage = 'Payment canceled.';
  }

  private confirmReservationPayment(sessionId: string, fallbackToDirectCreation = false): void {
    if (!this.pendingMockPayment) {
      this.pendingMockPayment = this.loadPendingReservationBatch();
    }

    if (!this.pendingMockPayment) {
      this.reservationMessage = 'Payment session not found. Please reserve again.';
      return;
    }

    if (this.pendingMockPayment.expiresAt <= Date.now()) {
      this.stopPaymentHoldCountdown();
      this.pendingMockPayment = null;
      this.pendingMockSessionId = '';
      this.clearPendingReservationBatch();
      this.reservationMessage = 'Payment window expired. Seats are available again.';
      return;
    }

    this.startPaymentHoldCountdown(this.pendingMockPayment.expiresAt);

    this.loading = true;
    this.cinemaApi.confirmReservationPayment(sessionId).subscribe({
      next: (reservation) => {
        this.loading = false;
        this.showMockPaymentPanel = false;
        this.pendingMockSessionId = '';
        this.pendingMockPayment = null;
        this.stopPaymentHoldCountdown();
        this.ticketReservation = reservation;
        this.generateTicketQrCode(reservation);
        this.downloadReservationPdf(reservation);
        this.reservationMessage = `Reservation created: ${reservation.id}`;
        this.resetReservationEditor();
        this.resetMockPaymentInputs();
        this.clearPendingReservationBatch();
        this.selectedSeatNumbers = [];
        this.numeroPlace = '';

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { module: 'reservations', paymentSuccess: null, sessionId: null, paymentCanceled: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });

        this.clearPendingReservationBatch();

        this.loadUserReservations();
        this.loadSessionReservations(this.selectedSeanceId);
      },
      error: (err: unknown) => {
        if (fallbackToDirectCreation && this.pendingMockPayment) {
          this.pendingMockSessionId = '';
          this.createReservationFromPendingPayment();
          return;
        }

        this.loading = false;
        this.reservationMessage = this.getErrorMessage(err, 'Payment confirmation failed.');
      },
    });
  }

  private savePendingReservationBatch(batch: PendingReservationBatch): void {
    sessionStorage.setItem(this.pendingReservationStorageKey, JSON.stringify(batch));
  }

  private loadPendingReservationBatch(): PendingReservationBatch | null {
    const raw = sessionStorage.getItem(this.pendingReservationStorageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as PendingReservationBatch;
      if (!parsed?.seanceId || !Array.isArray(parsed.seats) || parsed.seats.length === 0 || !parsed.expiresAt) {
        return null;
      }
      if (parsed.expiresAt <= Date.now()) {
        this.clearPendingReservationBatch();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private clearPendingReservationBatch(): void {
    sessionStorage.removeItem(this.pendingReservationStorageKey);
  }

  private startPaymentHoldCountdown(expiresAt: number): void {
    this.stopPaymentHoldCountdown();

    const update = (): void => {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      this.paymentHoldSecondsRemaining = seconds;
      if (seconds === 0) {
        this.stopPaymentHoldCountdown();
      }
    };

    update();
    this.paymentHoldTimerId = window.setInterval(update, 1000);
  }

  private stopPaymentHoldCountdown(): void {
    if (this.paymentHoldTimerId !== null) {
      window.clearInterval(this.paymentHoldTimerId);
      this.paymentHoldTimerId = null;
    }
    this.paymentHoldSecondsRemaining = 0;
  }

  formatCountdown(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  editReservation(reservation: ReservationResponseDTO): void {
    const reservationSeanceId = reservation.seanceId || this.findSeanceIdForReservation(reservation);
    if (!reservationSeanceId) {
      this.reservationMessage = 'Unable to identify the reservation session.';
      return;
    }

    this.editReservationId = reservation.id;
    this.editReservationUserId = (reservation.userId || this.currentUserId).trim();
    this.editReservationSeanceId = reservationSeanceId;
    this.editReservationSeat = reservation.numeroPlace;
    this.editReservationPrice = Number(reservation.prix ?? 25);
    this.showEditReservationModal = true;
    this.loadSessionReservations(reservationSeanceId);
    this.reservationMessage = '';
  }

  onEditReservationSessionChange(): void {
    if (!this.editReservationSeanceId) {
      return;
    }
    this.loadSessionReservations(this.editReservationSeanceId);
  }

  closeEditReservationModal(): void {
    this.showEditReservationModal = false;
    this.editReservationId = '';
    this.editReservationUserId = '';
    this.editReservationSeanceId = '';
    this.editReservationSeat = '';
    this.editReservationPrice = 25;
  }

  saveEditReservationModal(): void {
    const reservationId = this.editReservationId.trim();
    const seanceId = this.editReservationSeanceId.trim();
    const numeroPlace = this.editReservationSeat.trim();
    const prix = Number(this.editReservationPrice);

    if (!reservationId || !seanceId || !numeroPlace || !Number.isFinite(prix) || prix <= 0) {
      this.reservationMessage = 'Please provide valid session, seat and price.';
      return;
    }

    const selectedSeance = this.seances.find((item) => item.id === seanceId);
    const payload: ReservationRequestDTO = {
      seanceId,
      userId: this.editReservationUserId || this.currentUserId.trim(),
      numeroPlace,
      prix,
      salleId: selectedSeance?.salle,
    };

    this.loading = true;
    this.reservationMessage = '';
    this.cinemaApi.updateReservation(reservationId, payload).subscribe({
      next: (updatedReservation) => {
        this.loading = false;
        this.ticketReservation = updatedReservation;
        this.showTicketModal = true;
        this.generateTicketQrCode(updatedReservation);
        this.reservationMessage = `Reservation updated: ${updatedReservation.id}`;
        this.selectedSeatNumbers = [];
        this.numeroPlace = '';
        this.selectedSeanceId = seanceId;
        this.closeEditReservationModal();
        this.loadUserReservations();
        this.loadSessionReservations(seanceId);
      },
      error: (err: unknown) => {
        this.loading = false;
        this.reservationMessage = this.getErrorMessage(err, 'Reservation update failed.');
      },
    });
  }

  cancelReservationEdit(): void {
    this.resetReservationEditor();
    this.reservationMessage = 'Reservation edit canceled.';
  }

  private getSessionLabel(seanceId: string): string {
    const seance = this.seances.find((item) => item.id === seanceId);
    if (!seance) {
      return seanceId;
    }
    return `${seance.nomCinema} - ${seance.numeroSalle} - ${seance.dateSeance} ${seance.heureSeance}`;
  }

  private validateMockPaymentInputs(): boolean {
    if (this.mockPaymentMethod === 'card') {
      if (!this.mockCardHolder.trim()) {
        this.reservationMessage = 'Card holder name is required.';
        return false;
      }

      const cleanCardNumber = this.mockCardNumber.replace(/\s+/g, '');
      if (!/^\d{16}$/.test(cleanCardNumber)) {
        this.reservationMessage = 'Card number must contain exactly 16 digits.';
        return false;
      }

      if (!/^\d{2}\/\d{2}$/.test(this.mockCardExpiry.trim())) {
        this.reservationMessage = 'Card expiry must use two digits, slash, two digits (example: 20/26).';
        return false;
      }

      if (!/^\d{3,4}$/.test(this.mockCardCvv.trim())) {
        this.reservationMessage = 'CVV must contain 3 or 4 digits.';
        return false;
      }
    }

    if (this.mockPaymentMethod === 'paypal') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.mockPaypalEmail.trim())) {
        this.reservationMessage = 'A valid PayPal email is required.';
        return false;
      }
    }

    return true;
  }

  private resetMockPaymentInputs(): void {
    this.mockPaymentMethod = 'card';
    this.mockCardHolder = '';
    this.mockCardNumber = '';
    this.mockCardExpiry = '';
    this.mockCardCvv = '';
    this.mockPaypalEmail = '';
  }

  private findSeanceIdForReservation(reservation: ReservationResponseDTO): string {
    const matchedSeance = this.seances.find((seance) =>
      seance.nomCinema === reservation.nomCinema &&
      seance.numeroSalle === reservation.numeroSalle &&
      String(seance.dateSeance) === String(reservation.dateSeance) &&
      seance.heureSeance === reservation.heureSeance
    );
    return matchedSeance?.id ?? '';
  }

  private resetReservationEditor(): void {
    this.editingReservationId = null;
    this.editingReservationSeat = '';
    this.numeroPlace = '';
    this.prix = 25;
    this.selectedSeatNumbers = [];
  }

  private shouldOfferWaitlist(err: unknown, message: string): boolean {
    const lowered = message.toLowerCase();
    const hasFullKeyword = lowered.includes('session is full')
      || lowered.includes('waitlist')
      || lowered.includes('full')
      || lowered.includes('complet')
      || lowered.includes('pleine');

    if (hasFullKeyword) {
      return true;
    }

    if (err instanceof HttpErrorResponse && err.status === 409) {
      return true;
    }

    return false;
  }

  private resolveCurrentUserEmail(): string {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      return '';
    }

    try {
      const parsed = JSON.parse(storedUser);
      const email = parsed?.email;
      return typeof email === 'string' ? email : '';
    } catch {
      return '';
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get moduleTitle(): string {
    switch (this.activeModule) {
      case 'sessions':
        return 'Sessions';
      case 'halls':
        return 'Halls';
      case 'reservations':
        return 'Reservations';
      default:
        return 'Cinema';
    }
  }

  get selectedSeance(): SeanceResponseDTO | undefined {
    return this.seances.find((item) => item.id === this.selectedSeanceId);
  }

  get filteredSeances(): SeanceResponseDTO[] {
    const query = this.sessionSearch.trim().toLowerCase();
    if (!query) {
      return this.seances;
    }
    return this.seances.filter((item) => {
      const haystack = `${item.nomCinema} ${item.numeroSalle} ${item.dateSeance} ${item.heureSeance}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  get filteredCinemaGroups(): { [cinemaName: string]: SeanceResponseDTO[] } {
    const query = this.sessionSearch.trim().toLowerCase();
    if (!query) {
      return this.seancesGroupedByCinema;
    }
    const filtered: { [cinemaName: string]: SeanceResponseDTO[] } = {};
    for (const [cinemaName, seances] of Object.entries(this.seancesGroupedByCinema)) {
      if (cinemaName.toLowerCase().includes(query)) {
        filtered[cinemaName] = seances;
      } else {
        const filteredSeances = seances.filter((seance) => {
          const haystack = `${seance.numeroSalle} ${seance.dateSeance} ${seance.heureSeance}`.toLowerCase();
          return haystack.includes(query);
        });
        if (filteredSeances.length > 0) {
          filtered[cinemaName] = filteredSeances;
        }
      }
    }
    return filtered;
  }

  get availableSessions(): number {
    return this.filteredSeances.filter((_, i) => this.sessionStatus(i) === 'Available').length;
  }

  get averageSessionRating(): string {
    if (this.filteredSeances.length === 0) {
      return '0.0';
    }
    const total = this.filteredSeances.reduce((acc, _, i) => acc + Number(this.sessionRating(i)), 0);
    return (total / this.filteredSeances.length).toFixed(1);
  }

  sessionStatus(index: number): string {
    const bucket = index % 3;
    if (bucket === 1) {
      return 'Most Seats Taken';
    }
    return 'Available';
  }

  sessionWatching(index: number): number {
    return 96 + ((index * 11) % 29);
  }

  sessionRating(index: number): string {
    const rating = 0.4 + (((index * 19) % 47) / 10);
    return rating.toFixed(3);
  }

  hallOccupancy(index: number): number {
    return 64 + ((index * 17) % 34);
  }

  hallStatus(index: number): string {
    return this.hallOccupancy(index) >= 80 ? 'Limited' : 'Available';
  }

  selectSessionForBooking(seance: SeanceResponseDTO): void {
    this.selectedSeanceId = seance.id;
    this.selectedCinemaId = this.cinemas.find((c) => c.nom === seance.nomCinema)?.id ?? this.selectedCinemaId;
    this.activeModule = 'reservations';
    this.ticketReservation = null;
    this.ticketQrCodeDataUrl = '';
    this.selectedSeatNumbers = [];
    this.numeroPlace = '';
    this.loadSessionReservations(seance.id);
    this.reservationMessage = `Selected session ${seance.dateSeance} ${seance.heureSeance}. You can now complete your reservation.`;
    if (this.currentUserId.trim()) {
      this.loadUserReservations();
    }
  }

  private loadSeancesForSelection(): void {
    const cinemaId = this.selectedCinemaId.trim();

    if (this.activeModule === 'sessions' && !cinemaId) {
      // Load grouped by cinema for comparison
      this.cinemaApi.getSeancesGroupedByCinema().subscribe({
        next: (groupedSeances) => {
          this.seancesGroupedByCinema = groupedSeances;
          this.seances = Object.values(groupedSeances).flat();
          if (!this.seances.find((item) => item.id === this.selectedSeanceId)) {
            this.selectedSeanceId = '';
          }
          this.loading = false;
        },
        error: (err: unknown) => {
          this.loading = false;
          this.error = this.getErrorMessage(err, 'Failed to load seances.');
        },
      });
    } else {
      const request$ = cinemaId
        ? this.cinemaApi.getSeancesByCinema(cinemaId)
        : this.cinemaApi.getSeances();

      request$.subscribe({
        next: (seances) => {
          this.seances = seances;
          if (!this.seances.find((item) => item.id === this.selectedSeanceId)) {
            this.selectedSeanceId = '';
          }
          if (this.activeModule === 'reservations' && this.selectedSeanceId) {
            this.loadSessionReservations(this.selectedSeanceId);
          }
          this.loading = false;
        },
        error: (err: unknown) => {
          this.loading = false;
          this.error = this.getErrorMessage(err, 'Failed to load seances.');
        },
      });
    }
  }

  showTicket(reservation: ReservationResponseDTO): void {
    this.ticketReservation = reservation;
    this.showTicketModal = true;
    this.generateTicketQrCode(reservation);
  }

  closeTicketModal(): void {
    this.showTicketModal = false;
    this.ticketReservation = null;
  }

  private parseSeatNumbers(rawSeats: string): string[] {
    return rawSeats
      .split(',')
      .map((seat) => seat.trim())
      .filter((seat) => seat.length > 0)
      .filter((seat, index, list) => list.indexOf(seat) === index);
  }

  getReservationSeatLabel(reservation: ReservationResponseDTO): string {
    if (reservation.numeroPlaces && reservation.numeroPlaces.length > 0) {
      return reservation.numeroPlaces.join(', ');
    }
    return reservation.numeroPlace || '-';
  }

  private buildSeatMap(): void {
    const capacity = this.selectedSessionCapacity;
    const configuredRowCount = Number(this.selectedSessionRowCount) || 0;
    const configuredSeatsPerRow = Number(this.selectedSessionSeatsPerRow) || 0;

    const hasConfiguredLayout = configuredRowCount > 0 && configuredSeatsPerRow > 0;
    const fallbackColumnCount = 23;
    const rowCount = hasConfiguredLayout
      ? configuredRowCount
      : (capacity > 0 ? Math.ceil(capacity / fallbackColumnCount) : 0);
    const seatsPerRow = hasConfiguredLayout ? configuredSeatsPerRow : fallbackColumnCount;
    const reservedSeats = new Set(this.selectedSessionReservedSeats);

    this.seatMapRows = Array.from({ length: rowCount }, (_, rowIndex) => {
      const label = String.fromCharCode(65 + rowIndex);
      const seatCount = hasConfiguredLayout
        ? seatsPerRow
        : Math.min(seatsPerRow, capacity - rowIndex * seatsPerRow);
      const seats = Array.from({ length: seatCount }, (_, seatIndex) => {
        const id = `${label}${seatIndex + 1}`;
        return {
          id,
          reserved: reservedSeats.has(id),
          selected: this.selectedSeatNumbers.includes(id),
        };
      });

      return { label, seats };
    });
  }

  private syncSeatInputFromSelection(): void {
    this.numeroPlace = this.selectedSeatNumbers.join(', ');
  }

  getSeatLeftBlock(seats: SeatMapSeat[]): SeatMapSeat[] {
    return seats.slice(0, Math.min(4, seats.length));
  }

  getSeatCenterBlock(seats: SeatMapSeat[]): SeatMapSeat[] {
    if (seats.length <= 8) {
      return seats.slice(Math.min(4, seats.length));
    }
    return seats.slice(4, seats.length - 4);
  }

  getSeatRightBlock(seats: SeatMapSeat[]): SeatMapSeat[] {
    return seats.length > 8 ? seats.slice(seats.length - 4) : [];
  }

  async downloadReservationPdf(reservation: ReservationResponseDTO): Promise<void> {
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) {
      this.reservationMessage = 'Popup blocked. Please allow popups and try Download PDF again.';
      return;
    }

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(this.buildReservationQrPayload(reservation), { width: 240, margin: 2 });
    } catch {
      qrDataUrl = this.ticketQrCodeDataUrl;
    }

    const qrImageBlock = qrDataUrl
      ? `<img src="${qrDataUrl}" alt="Reservation QR" style="width:180px;height:180px;border:1px solid #ddd;padding:8px;border-radius:8px;" />`
      : '<p style="color:#555;">QR code unavailable.</p>';
    const seatLabel = this.getReservationSeatLabel(reservation);
    const formattedPrice = Number(reservation.prix ?? 0).toFixed(2);
    const generatedAt = new Date().toLocaleString();

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Reservation ${this.escapeHtml(reservation.id)}</title>
  <style>
    body {
      margin: 0;
      background: #eef1f7;
      color: #101726;
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    }
    .page {
      max-width: 1080px;
      margin: 14px auto;
      padding: 0 12px;
    }
    .sheet {
      background: #ffffff;
      border: 1px solid #d7dfef;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 14px 36px rgba(25, 41, 78, 0.14);
    }
    .doc-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 24px 0;
      font-size: 13px;
      color: #42506b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .doc-top strong {
      color: #8b5cf6;
    }
    .header {
      min-height: 138px;
      padding: 22px 24px 20px;
      background: #ffffff;
      color: #0f172a;
      border-top: 1px solid #e4e9f3;
      border-bottom: 1px solid #e4e9f3;
    }
    .brand {
      font-size: 52px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -0.8px;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 38%, #ec4899 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }
    .title {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.2px;
      color: #1f2d47;
    }
    .subtitle {
      margin-top: 8px;
      font-size: 16px;
      color: #5a6b88;
      opacity: 1;
    }
    .content {
      padding: 20px 24px 22px;
    }
    .status {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      color: #0d2b57;
      background: #dbe8ff;
      border: 1px solid #b8d0ff;
      margin-bottom: 18px;
      text-transform: uppercase;
      box-shadow: 0 3px 10px rgba(93, 131, 196, 0.12);
    }
    .grid {
      display: grid;
      grid-template-columns: 1.7fr 1fr;
      gap: 22px;
      align-items: start;
    }
    .card {
      border: 1px solid #dfe6f3;
      border-radius: 16px;
      padding: 18px 18px 14px;
      background: #fbfcff;
    }
    .card-title {
      margin: 0 0 14px;
      font-size: 13px;
      font-weight: 700;
      color: #253551;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .row {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 12px;
      margin: 9px 0;
      font-size: 14px;
      line-height: 1.35;
    }
    .label {
      color: #4f607d;
      font-weight: 600;
    }
    .value {
      color: #0f172a;
      font-weight: 600;
      word-break: break-word;
    }
    .price {
      color: #11903d;
      font-weight: 700;
    }
    .qr-wrap {
      text-align: center;
    }
    .qr-wrap .card-title {
      font-size: 14px;
      text-align: center;
    }
    .qr-box {
      border: 1px dashed #b8c6df;
      border-radius: 14px;
      padding: 14px;
      background: #ffffff;
    }
    .qr-frame {
      border: 1px solid #d8e0ef;
      border-radius: 10px;
      padding: 14px;
      display: inline-block;
      background: #fff;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8);
    }
    .qr-box img {
      width: 220px;
      height: 220px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    .qr-help {
      margin-top: 12px;
      font-size: 13px;
      color: #4f607d;
    }
    .footer {
      margin-top: 18px;
      border-top: 1px solid #e5eaf3;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
      color: #5f6f88;
      flex-wrap: wrap;
    }
    @media (max-width: 760px) {
      .grid { grid-template-columns: 1fr; }
      .row { grid-template-columns: 120px 1fr; }
    }
    @media print {
      body { background: #fff; }
      .page { margin: 0; padding: 0; }
      .sheet { border: 0; box-shadow: none; border-radius: 0; }
      .header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .brand {
        background: none;
        -webkit-text-fill-color: #8b5cf6;
        color: #8b5cf6;
      }
      .doc-top {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sheet">
      <div class="doc-top">
        <span><strong>ShowMatchGoOn</strong> reservation ticket</span>
        <span>Reservation ${this.escapeHtml(reservation.id)}</span>
      </div>
      <div class="header">
        <div class="brand">ShowMatchGoOn</div>
        <h1 class="title">Reservation Ticket</h1>
        <div class="subtitle">Your Entertainment Hub</div>
      </div>

      <div class="content">
        <div class="status">${this.escapeHtml(reservation.statut || 'pending')}</div>

        <div class="grid">
          <div class="card">
            <h2 class="card-title">Reservation Details</h2>
            <div class="row"><span class="label">Reservation ID</span><span class="value">${this.escapeHtml(reservation.id)}</span></div>
            <div class="row"><span class="label">Cinema</span><span class="value">${this.escapeHtml(reservation.nomCinema || '-')}</span></div>
            <div class="row"><span class="label">Hall</span><span class="value">${this.escapeHtml(reservation.numeroSalle || '-')}</span></div>
            <div class="row"><span class="label">Date & Time</span><span class="value">${this.escapeHtml(String(reservation.dateSeance || '-'))} ${this.escapeHtml(String(reservation.heureSeance || ''))}</span></div>
            <div class="row"><span class="label">Seat(s)</span><span class="value">${this.escapeHtml(seatLabel)}</span></div>
            <div class="row"><span class="label">Price</span><span class="value price">${this.escapeHtml(formattedPrice)} EUR</span></div>
          </div>

          <div class="card qr-wrap">
            <h2 class="card-title">QR Verification</h2>
            <div class="qr-box">
              <div class="qr-frame">
                ${qrImageBlock}
              </div>
            </div>
            <div class="qr-help">Present this QR code at the cinema entrance.</div>
          </div>
        </div>

        <div class="footer">
          <span>Generated by ShowMatchGoOn</span>
          <span>Issued: ${this.escapeHtml(generatedAt)}</span>
        </div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private generateTicketQrCode(reservation: ReservationResponseDTO): void {
    QRCode.toDataURL(this.buildReservationQrPayload(reservation), { width: 240, margin: 2 })
      .then((url) => {
        this.ticketQrCodeDataUrl = url;
      })
      .catch(() => {
        this.ticketQrCodeDataUrl = '';
      });
  }

  private buildReservationQrPayload(reservation: ReservationResponseDTO): string {
    const seats = reservation.numeroPlaces?.length ? reservation.numeroPlaces.join(',') : reservation.numeroPlace;
    return [
      'SMGO_RESERVATION',
      `id=${reservation.id}`,
      `user=${reservation.userId}`,
      `seance=${reservation.seanceId ?? ''}`,
      `date=${reservation.dateSeance ?? ''}`,
      `time=${reservation.heureSeance ?? ''}`,
      `seats=${seats ?? ''}`,
    ].join('|');
  }

  private resolveCurrentUserId(): string {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.userId) {
          return String(parsed.userId);
        }
      } catch {
        // Continue with token/local fallback.
      }
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const tokenUserId = payload.userId || payload.id || payload.sub;
        if (tokenUserId) {
          return String(tokenUserId);
        }
      }
    } catch {
      // Ignore parse errors.
    }

    return '';
  }

  private resolveCurrentUserName(): string {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      return '';
    }

    try {
      const parsed = JSON.parse(storedUser);
      const username = parsed?.username;
      return typeof username === 'string' ? username : '';
    } catch {
      return '';
    }
  }

  private loadActiveModule(): void {
    switch (this.activeModule) {
      case 'halls':
        this.loadHalls();
        break;
      case 'reservations':
        this.loadReservationsModule();
        break;
      case 'sessions':
      case 'cinema':
      default:
        this.refreshCinemaData();
        break;
    }
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const backendMessage = err.error?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim()) {
        return backendMessage;
      }
      if (typeof err.error === 'string' && err.error.trim()) {
        return err.error;
      }
      if (typeof err.message === 'string' && err.message.trim()) {
        return err.message;
      }
      return fallback;
    }
    if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
      return err.message;
    }
    return fallback;
  }
}


