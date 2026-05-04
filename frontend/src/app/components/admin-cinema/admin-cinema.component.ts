import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MapPin, Building, Calendar, Plus, Edit2, Trash2 } from 'lucide-angular';
import {
  CinemaApiService,
  CinemaRequestDTO,
  CinemaResponseDTO,
  ReservationResponseDTO,
  SalleRequestDTO,
  SalleResponseDTO,
  SeanceRequestDTO,
  SeanceResponseDTO,
  ReservationRequestDTO,
} from '../../services/cinema-api.service';

type SarraModule = 'cinemas' | 'salles' | 'seances' | 'reservations';

@Component({
  selector: 'app-admin-cinema',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-cinema.component.html',
  styleUrls: ['./admin-cinema.component.css'],
})
export class AdminCinemaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly MapPinIcon = MapPin;
  readonly BuildingIcon = Building;
  readonly CalendarIcon = Calendar;
  readonly PlusIcon = Plus;
  readonly Edit2Icon = Edit2;
  readonly Trash2Icon = Trash2;

  cinemas: CinemaResponseDTO[] = [];
  salles: SalleResponseDTO[] = [];
  seances: SeanceResponseDTO[] = [];
  reservations: ReservationResponseDTO[] = [];

  loading = false;
  error: string | null = null;
  activeTab: SarraModule = 'cinemas';
  editingCinemaId: string | null = null;
  editingSalleId: string | null = null;
  editingSeanceId: string | null = null;
  editingReservationId: string | null = null;
  showCinemaForm = false;
  showSalleForm = false;
  showSeanceForm = false;
  showReservationForm = false;

  cinemaForm: CinemaRequestDTO = {
    nom: '',
    adresse: '',
    ville: '',
  };

  salleForm: SalleRequestDTO = {
    name: '',
    capacity: 60,
  };

  seanceForm: SeanceRequestDTO = {
    dateSeance: '',
    heureSeance: '',
    salleId: '',
    cinemaId: '',
    contenuId: '',
  };

  reservationForm: ReservationRequestDTO = {
    seanceId: '',
    userId: '',
    numeroPlace: '',
    prix: 0,
    contenuId: '',
  };

  constructor(
    private readonly cinemaApi: CinemaApiService
  ) {}

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const requestedModule = (params.get('module') as SarraModule | null) ?? 'cinemas';
        this.activeTab = ['cinemas', 'salles', 'seances', 'reservations'].includes(requestedModule)
          ? requestedModule
          : 'cinemas';
        this.loadAll();
      });
  }

  loadAll(): void {
    this.loading = true;
    this.error = null;
    this.cinemaApi.getCinemas().subscribe({
      next: (cinemas) => {
        this.cinemas = cinemas;
        this.cinemaApi.getSalles().subscribe({
          next: (salles) => {
            this.salles = salles;
            this.cinemaApi.getSeances().subscribe({
              next: (seances) => {
                this.seances = seances;
                this.cinemaApi.getReservations().subscribe({
                  next: (reservations) => {
                    this.reservations = reservations;
                    this.loading = false;
                  },
                  error: (err: unknown) => {
                    this.loading = false;
                    this.error = this.toErrorMessage(err, 'Failed to load reservations.');
                  },
                });
              },
              error: (err: unknown) => {
                this.loading = false;
                this.error = this.toErrorMessage(err, 'Failed to load seances.');
              },
            });
          },
          error: (err: unknown) => {
            this.loading = false;
            this.error = this.toErrorMessage(err, 'Failed to load salles.');
          },
        });
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, 'Failed to load cinemas.');
      },
    });
  }

  selectTab(tab: string): void {
    if (['cinemas', 'salles', 'seances', 'reservations'].includes(tab)) {
      this.activeTab = tab as SarraModule;
    }
  }

  get cinemaCitiesCovered(): number {
    return new Set(this.cinemas.map((item) => item.ville?.trim()).filter(Boolean)).size;
  }

  get totalHallCapacity(): number {
    return this.salles.reduce((acc, item) => acc + (Number(item.capacity) || 0), 0);
  }

  get averageHallCapacity(): number {
    if (this.salles.length === 0) {
      return 0;
    }
    return Math.round(this.totalHallCapacity / this.salles.length);
  }

  get scheduledDatesCount(): number {
    return new Set(this.seances.map((item) => item.dateSeance)).size;
  }

  get scheduledTimesCount(): number {
    return new Set(this.seances.map((item) => item.heureSeance)).size;
  }

  get reservationRevenue(): string {
    const total = this.reservations.reduce((acc, item) => acc + (Number(item.prix) || 0), 0);
    return total.toFixed(2);
  }

  get reservationStatusesText(): string {
    const statuses = Array.from(new Set(this.reservations.map((item) => item.statut).filter(Boolean)));
    return statuses.length ? statuses.join(', ').toLowerCase() : 'confirmed, pending, cancelled';
  }

  openCreateCinema(): void {
    this.showCinemaForm = true;
    this.resetCinemaForm();
  }

  openCreateSalle(): void {
    this.showSalleForm = true;
    this.editingSalleId = null;
    this.salleForm = { name: '', capacity: 60 };
  }

  openCreateSeance(): void {
    this.showSeanceForm = true;
    this.editingSeanceId = null;
    this.seanceForm = {
      dateSeance: '',
      heureSeance: '',
      salleId: '',
      cinemaId: '',
      contenuId: '',
    };
  }

  openCreateReservation(): void {
    this.showReservationForm = true;
    this.editingReservationId = null;
    this.reservationForm = {
      seanceId: '',
      userId: '',
      numeroPlace: '',
      prix: 0,
      contenuId: '',
    };
  }

  editSalle(salle: SalleResponseDTO): void {
    this.showSalleForm = true;
    this.editingSalleId = salle.id;
    this.salleForm = {
      name: salle.name,
      capacity: salle.capacity
    };
  }

  editSeance(seance: SeanceResponseDTO): void {
    const matchedSalle = this.salles.find((s) => s.name === seance.numeroSalle);
    const matchedCinema = this.cinemas.find((c) => c.nom === seance.nomCinema);

    this.showSeanceForm = true;
    this.editingSeanceId = seance.id;
    this.seanceForm = {
      dateSeance: seance.dateSeance,
      heureSeance: seance.heureSeance,
      salleId: matchedSalle?.id || '',
      cinemaId: matchedCinema?.id || '',
      contenuId: seance.contenuId || ''
    };
  }

  editReservation(reservation: ReservationResponseDTO): void {
    const matchedSeance = this.seances.find(
      (s) =>
        s.nomCinema === reservation.nomCinema &&
        s.numeroSalle === reservation.numeroSalle &&
        String(s.dateSeance) === String(reservation.dateSeance) &&
        s.heureSeance === reservation.heureSeance
    );

    this.showReservationForm = true;
    this.editingReservationId = reservation.id;
    this.reservationForm = {
      seanceId: matchedSeance?.id || '',
      userId: reservation.userId,
      numeroPlace: reservation.numeroPlace,
      prix: reservation.prix,
      contenuId: reservation.contenuId || '',
    };
  }

  saveReservation(): void {
    if (!this.reservationForm.seanceId || !this.reservationForm.userId.trim() || !this.reservationForm.numeroPlace.trim() || this.reservationForm.prix <= 0) {
      this.error = 'Session, user ID, seat number and positive price are required.';
      return;
    }

    const payload: ReservationRequestDTO = {
      seanceId: this.reservationForm.seanceId,
      userId: this.reservationForm.userId.trim(),
      numeroPlace: this.reservationForm.numeroPlace.trim(),
      prix: this.reservationForm.prix,
      contenuId: this.reservationForm.contenuId?.trim() || undefined,
    };

    this.loading = true;
    const request$ = this.editingReservationId
      ? this.cinemaApi.updateReservation(this.editingReservationId, payload)
      : this.cinemaApi.createReservation(payload);

    request$.subscribe({
      next: () => {
        this.showReservationForm = false;
        this.editingReservationId = null;
        this.reservationForm = {
          seanceId: '',
          userId: '',
          numeroPlace: '',
          prix: 0,
          contenuId: '',
        };
        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, this.editingReservationId ? 'Failed to update reservation.' : 'Failed to create reservation.');
      },
    });
  }

  deleteReservation(id: string): void {
    if (!confirm('Delete this reservation?')) {
      return;
    }

    this.loading = true;
    this.cinemaApi.deleteReservation(id).subscribe({
      next: () => {
        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, 'Failed to delete reservation.');
      },
    });
  }

  editCinema(cinema: CinemaResponseDTO): void {
    this.showCinemaForm = true;
    this.editingCinemaId = cinema.id;
    this.cinemaForm = {
      nom: cinema.nom,
      adresse: cinema.adresse,
      ville: cinema.ville,
    };
  }

  resetCinemaForm(): void {
    this.editingCinemaId = null;
    this.showCinemaForm = false;
    this.cinemaForm = {
      nom: '',
      adresse: '',
      ville: '',
    };
  }

  saveCinema(): void {
    if (!this.cinemaForm.nom.trim() || !this.cinemaForm.adresse.trim() || !this.cinemaForm.ville.trim()) {
      this.error = 'Cinema name, address and city are required.';
      return;
    }

    this.loading = true;
    const payload: CinemaRequestDTO = {
      nom: this.cinemaForm.nom.trim(),
      adresse: this.cinemaForm.adresse.trim(),
      ville: this.cinemaForm.ville.trim(),
    };

    if (this.editingCinemaId) {
      this.cinemaApi.updateCinema(this.editingCinemaId, payload).subscribe({
        next: () => {
          this.resetCinemaForm();
          this.loadAll();
        },
        error: (err: unknown) => {
          this.loading = false;
          this.error = this.toErrorMessage(err, 'Failed to update cinema.');
        },
      });
    } else {
      this.cinemaApi.createCinema(payload).subscribe({
        next: () => {
          this.resetCinemaForm();
          this.loadAll();
        },
        error: (err: unknown) => {
          this.loading = false;
          this.error = this.toErrorMessage(err, 'Failed to create cinema.');
        },
      });
    }
  }

  deleteCinema(id: string): void {
    if (!confirm('Delete this cinema?')) {
      return;
    }

    this.loading = true;
    this.cinemaApi.deleteCinema(id).subscribe({
      next: () => {
        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, 'Failed to delete cinema.');
      },
    });
  }

  createSalle(): void {
    if (!this.salleForm.name.trim() || this.salleForm.capacity <= 0) {
      this.error = 'Salle name and positive capacity are required.';
      return;
    }

    this.loading = true;
    const payload: SalleRequestDTO = {
      name: this.salleForm.name.trim(),
      capacity: this.salleForm.capacity,
    };

    const request$ = this.editingSalleId
      ? this.cinemaApi.updateSalle(this.editingSalleId, payload)
      : this.cinemaApi.createSalle(payload);

    request$.subscribe({
      next: () => {
        this.showSalleForm = false;
        this.editingSalleId = null;
        this.salleForm = { name: '', capacity: 60 };
        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, this.editingSalleId ? 'Failed to update hall.' : 'Failed to create hall.');
      },
    });
  }

  deleteSalle(id: string): void {
    if (!confirm('Delete this salle?')) {
      return;
    }

    this.loading = true;
    this.cinemaApi.deleteSalle(id).subscribe({
      next: () => {
        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, 'Failed to delete salle.');
      },
    });
  }

  createSeance(): void {
    if (!this.seanceForm.dateSeance || !this.seanceForm.heureSeance || !this.seanceForm.salleId || !this.seanceForm.cinemaId) {
      this.error = 'Date, time, salle and cinema are required for seance.';
      return;
    }

    this.loading = true;
    const payload: SeanceRequestDTO = {
      dateSeance: this.seanceForm.dateSeance,
      heureSeance: this.seanceForm.heureSeance,
      salleId: this.seanceForm.salleId,
      cinemaId: this.seanceForm.cinemaId,
      contenuId: this.seanceForm.contenuId?.trim() || undefined,
    };

    const request$ = this.editingSeanceId
      ? this.cinemaApi.updateSeance(this.editingSeanceId, payload)
      : this.cinemaApi.createSeance(payload);

    request$.subscribe({
      next: () => {
        this.showSeanceForm = false;
        this.editingSeanceId = null;
        this.seanceForm = {
          dateSeance: '',
          heureSeance: '',
          salleId: '',
          cinemaId: '',
          contenuId: '',
        };
        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, this.editingSeanceId ? 'Failed to update session.' : 'Failed to create session.');
      },
    });
  }

  deleteSeance(id: string): void {
    if (!confirm('Delete this seance?')) {
      return;
    }

    this.loading = true;
    this.cinemaApi.deleteSeance(id).subscribe({
      next: () => {
        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, 'Failed to delete seance.');
      },
    });
  }

  private toErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
      return err.message;
    }
    return fallback;
  }
}


