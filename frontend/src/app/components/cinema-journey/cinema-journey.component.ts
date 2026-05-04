import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Ticket, MapPin, Calendar, RefreshCw, Armchair, Film } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CinemaApiService,
  CinemaResponseDTO,
  ReservationRequestDTO,
  ReservationResponseDTO,
  SalleResponseDTO,
  SeanceResponseDTO,
} from '../../services/cinema-api.service';

type SarraModule = 'cinema' | 'sessions' | 'halls' | 'reservations';

@Component({
  selector: 'app-cinema-journey',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cinema-journey.component.html',
  styleUrls: ['./cinema-journey.component.css'],
})
export class CinemaJourneyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly TicketIcon = Ticket;
  readonly MapPinIcon = MapPin;
  readonly CalendarIcon = Calendar;
  readonly RefreshIcon = RefreshCw;
  readonly SeatIcon = Armchair;
  readonly FilmIcon = Film;

  activeModule: SarraModule = 'cinema';
  cinemas: CinemaResponseDTO[] = [];
  salles: SalleResponseDTO[] = [];
  seances: SeanceResponseDTO[] = [];
  reservations: ReservationResponseDTO[] = [];

  loading = false;
  loadingReservations = false;
  selectedCinemaId = '';
  selectedSeanceId = '';
  currentUserId = '';
  numeroPlace = '';
  prix = 25;
  reservationMessage = '';
  error = '';
  sessionSearch = '';

  constructor(private readonly cinemaApi: CinemaApiService) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const requestedModule = (params.get('module') as SarraModule | null) ?? 'cinema';
        this.activeModule = ['cinema', 'sessions', 'halls', 'reservations'].includes(requestedModule)
          ? requestedModule
          : 'cinema';
        this.loadActiveModule();
      });
  }

  refreshCinemaData(): void {
    this.loading = true;
    this.error = '';

    this.cinemaApi.getCinemas().subscribe({
      next: (cinemas) => {
        this.cinemas = cinemas;
        this.loadSeancesForSelection();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.getErrorMessage(err, 'Failed to load cinemas.');
      },
    });
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
  }

  onCinemaChange(): void {
    this.loadSeancesForSelection();
  }

  loadUserReservations(): void {
    if (!this.currentUserId.trim()) {
      this.reservationMessage = 'Enter your user id to fetch reservations.';
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

  reserveSeat(): void {
    if (!this.selectedSeanceId) {
      this.reservationMessage = 'Select a seance first.';
      return;
    }
    if (!this.currentUserId.trim()) {
      this.reservationMessage = 'User id is required.';
      return;
    }
    if (!this.numeroPlace.trim()) {
      this.reservationMessage = 'Seat number is required.';
      return;
    }
    if (this.prix <= 0) {
      this.reservationMessage = 'Price must be greater than 0.';
      return;
    }

    const payload: ReservationRequestDTO = {
      seanceId: this.selectedSeanceId,
      userId: this.currentUserId.trim(),
      numeroPlace: this.numeroPlace.trim(),
      prix: this.prix,
    };

    this.loading = true;
    this.reservationMessage = '';

    this.cinemaApi.createReservation(payload).subscribe({
      next: (reservation) => {
        this.loading = false;
        this.reservationMessage = `Reservation created: ${reservation.id}`;
        this.numeroPlace = '';
        this.loadUserReservations();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.reservationMessage = this.getErrorMessage(err, 'Reservation failed.');
      },
    });
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
    this.reservationMessage = `Selected session ${seance.dateSeance} ${seance.heureSeance}. You can now complete your reservation.`;
    if (this.currentUserId.trim()) {
      this.loadUserReservations();
    }
  }

  private loadSeancesForSelection(): void {
    const cinemaId = this.selectedCinemaId.trim();
    const request$ = cinemaId
      ? this.cinemaApi.getSeancesByCinema(cinemaId)
      : this.cinemaApi.getSeances();

    request$.subscribe({
      next: (seances) => {
        this.seances = seances;
        if (!this.seances.find((item) => item.id === this.selectedSeanceId)) {
          this.selectedSeanceId = this.seances[0]?.id ?? '';
        }
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.getErrorMessage(err, 'Failed to load seances.');
      },
    });
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
    if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
      return err.message;
    }
    return fallback;
  }
}


