import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
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
  ReservationPaymentCheckoutRequestDTO,
} from '../../services/cinema-api.service';

type SarraModule = 'cinemas' | 'salles' | 'seances' | 'reservations';
type MockPaymentMethod = 'card' | 'paypal';

@Component({
  selector: 'app-admin-cinema',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-cinema.component.html',
  styleUrls: ['./admin-cinema.component.css'],
})
export class AdminCinemaComponent implements OnInit {
  private readonly hallLayoutOverridesKey = 'hall-layout-overrides';
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
  selectedSessionFilterId = '';
  showCinemaForm = false;
  showSalleForm = false;
  showSeanceForm = false;
  showReservationForm = false;
  showMockPaymentPanel = false;
  mockPaymentMethod: MockPaymentMethod = 'card';
  mockCardHolder = '';
  mockCardNumber = '';
  mockCardExpiry = '';
  mockCardCvv = '';
  mockPaypalEmail = '';
  pendingMockSessionId = '';
  pendingDirectReservationPayload: ReservationRequestDTO | null = null;
  pendingMockPayment: {
    userId: string;
    numeroPlace: string;
    prix: number;
    sessionLabel: string;
  } | null = null;

  cinemaForm: CinemaRequestDTO = {
    nom: '',
    adresse: '',
    ville: '',
  };

  salleForm: SalleRequestDTO = {
    name: '',
    capacity: 60,
    rowCount: 5,
    seatsPerRow: 12,
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
    salleId: '',
  };

  constructor(
    private readonly cinemaApi: CinemaApiService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const requestedModule = (params.get('module') as SarraModule | null) ?? 'cinemas';
        this.activeTab = ['cinemas', 'salles', 'seances', 'reservations'].includes(requestedModule)
          ? requestedModule
          : 'cinemas';

        const sessionId = params.get('sessionId');
        const paymentSuccess = params.get('paymentSuccess') === '1';
        if (sessionId && paymentSuccess) {
          this.confirmReservationPayment(sessionId);
          return;
        }

        if (params.get('paymentCanceled') === '1') {
          this.error = 'Payment was canceled.';
        }

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
                this.loadReservations();
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

  private loadReservations(): void {
    const request$ = this.selectedSessionFilterId
      ? this.cinemaApi.getReservationsBySeance(this.selectedSessionFilterId)
      : this.cinemaApi.getReservations();

    request$.subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, 'Failed to load reservations.');
      },
    });
  }

  onSessionFilterChange(): void {
    this.loading = true;
    this.loadReservations();
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
    this.editingCinemaId = null;
    this.cinemaForm = {
      nom: '',
      adresse: '',
      ville: '',
    };
    this.showCinemaForm = true;
  }

  openCreateSalle(): void {
    this.showSalleForm = true;
    this.editingSalleId = null;
    this.salleForm = { name: '', capacity: 60, rowCount: 5, seatsPerRow: 12 };
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
      salleId: '',
    };
  }

  editSalle(salle: SalleResponseDTO): void {
    const rowCount = Number(salle.rowCount) > 0
      ? Number(salle.rowCount)
      : Math.max(1, Math.ceil((Number(salle.capacity) || 1) / 23));
    const seatsPerRow = Number(salle.seatsPerRow) > 0
      ? Number(salle.seatsPerRow)
      : Math.max(1, Math.ceil((Number(salle.capacity) || 1) / rowCount));

    this.showSalleForm = true;
    this.editingSalleId = salle.id;
    this.salleForm = {
      name: salle.name,
      capacity: rowCount * seatsPerRow,
      rowCount,
      seatsPerRow,
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
    const reservationSeanceId = reservation.seanceId || '';
    const matchedSeance = this.seances.find((s) => s.id === reservationSeanceId) || this.seances.find(
      (s) =>
        s.nomCinema === reservation.nomCinema &&
        s.numeroSalle === reservation.numeroSalle &&
        String(s.dateSeance) === String(reservation.dateSeance) &&
        s.heureSeance === reservation.heureSeance
    );

    const matchedSalle = this.salles.find(
      (s) => s.id === matchedSeance?.salle || s.name === matchedSeance?.numeroSalle
    );

    this.showReservationForm = true;
    this.editingReservationId = reservation.id;
    this.reservationForm = {
      seanceId: reservationSeanceId || matchedSeance?.id || '',
      userId: String(reservation.userId ?? ''),
      numeroPlace: String(reservation.numeroPlace ?? ''),
      prix: Number(reservation.prix ?? 0),
      contenuId: String(reservation.contenuId ?? ''),
      salleId: matchedSalle?.id || reservation.salleId || '',
    };
  }

  onReservationSessionChange(): void {
    const selectedSeance = this.seances.find((s) => s.id === this.reservationForm.seanceId);
    if (!selectedSeance) {
      this.reservationForm.salleId = '';
      return;
    }
    const matchedSalle = this.salles.find((s) => s.name === selectedSeance.numeroSalle || s.id === selectedSeance.salle);
    this.reservationForm.salleId = matchedSalle?.id || selectedSeance.salle || '';
  }

  saveReservation(): void {
    const seanceId = String(this.reservationForm.seanceId ?? '').trim();
    const userId = String(this.reservationForm.userId ?? '').trim();
    const numeroPlace = String(this.reservationForm.numeroPlace ?? '').trim();
    const prix = Number(this.reservationForm.prix ?? 0);

    if (!seanceId || !userId || !numeroPlace || prix <= 0) {
      this.error = 'Session, user ID, seat number and positive price are required.';
      return;
    }

    const selectedSeance = this.seances.find((s) => s.id === seanceId);
    const payload: ReservationRequestDTO = {
      seanceId,
      userId,
      numeroPlace,
      prix,
      contenuId: String(this.reservationForm.contenuId ?? '').trim() || undefined,
      salleId: String(this.reservationForm.salleId ?? '').trim() || selectedSeance?.salle || undefined,
    };

    this.loading = true;

    if (this.editingReservationId) {
      this.cinemaApi.updateReservation(this.editingReservationId, payload).subscribe({
        next: () => {
          this.showReservationForm = false;
          this.editingReservationId = null;
          this.reservationForm = {
            seanceId: '',
            userId: '',
            numeroPlace: '',
            prix: 0,
            contenuId: '',
            salleId: '',
          };
          this.loadAll();
        },
        error: (err: unknown) => {
          this.loading = false;
          this.error = this.toErrorMessage(err, 'Failed to update reservation.');
        },
      });
      return;
    }

    const paymentPayload: ReservationPaymentCheckoutRequestDTO = {
      reservation: payload,
      successUrl: `${window.location.origin}/admin/cinema?module=reservations&paymentSuccess=1`,
      cancelUrl: `${window.location.origin}/admin/cinema?module=reservations&paymentCanceled=1`,
    };

    this.cinemaApi.createReservationCheckout(paymentPayload).subscribe({
      next: (checkout) => {
        this.loading = false;
        if (checkout.sessionId?.startsWith('mock_')) {
          this.resetMockPaymentInputs();
          this.pendingMockSessionId = checkout.sessionId;
          this.pendingDirectReservationPayload = null;
          this.pendingMockPayment = {
            userId,
            numeroPlace,
            prix,
            sessionLabel: this.getSessionLabel(seanceId),
          };
          this.showMockPaymentPanel = true;
          return;
        }
        if (checkout.checkoutUrl) {
          window.location.href = checkout.checkoutUrl;
          return;
        }
        this.error = 'Unable to start payment checkout.';
      },
      error: (err: unknown) => {
        const backendMessage = this.toErrorMessage(err, 'Failed to start payment checkout.');
        const lowered = backendMessage.toLowerCase();

        if (lowered.includes('stripe is not configured') || lowered.includes('payment provider is not configured')) {
          this.loading = false;
          this.resetMockPaymentInputs();
          this.pendingMockSessionId = '';
          this.pendingDirectReservationPayload = payload;
          this.pendingMockPayment = {
            userId,
            numeroPlace,
            prix,
            sessionLabel: this.getSessionLabel(seanceId),
          };
          this.showMockPaymentPanel = true;
          this.error = null;
          return;
        }

        this.loading = false;
        this.error = backendMessage;
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
          this.notifyCinemaUpdated();
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
          this.notifyCinemaUpdated();
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
        this.notifyCinemaUpdated();
        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, 'Failed to delete cinema.');
      },
    });
  }

  createSalle(): void {
    const rowCount = Number(this.salleForm.rowCount ?? 0);
    const seatsPerRow = Number(this.salleForm.seatsPerRow ?? 0);
    if (!this.salleForm.name.trim() || rowCount <= 0 || seatsPerRow <= 0) {
      this.error = 'Hall name, row count and seats per row are required.';
      return;
    }

    this.loading = true;
    const capacity = rowCount * seatsPerRow;
    const payload: SalleRequestDTO = {
      name: this.salleForm.name.trim(),
      capacity,
      rowCount,
      seatsPerRow,
    };

    const request$ = this.editingSalleId
      ? this.cinemaApi.updateSalle(this.editingSalleId, payload)
      : this.cinemaApi.createSalle(payload);

    request$.subscribe({
      next: () => {
        this.saveHallLayoutOverride(this.salleForm.name, rowCount, seatsPerRow);
        this.showSalleForm = false;
        this.editingSalleId = null;
        this.salleForm = { name: '', capacity: 60, rowCount: 5, seatsPerRow: 12 };
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

  private notifyCinemaUpdated(): void {
    try {
      localStorage.setItem('cinemas-updated', Date.now().toString());
    } catch {
      // Ignore storage errors.
    }
  }

  private toErrorMessage(err: unknown, fallback: string): string {
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

  private saveHallLayoutOverride(hallName: string, rowCount: number, seatsPerRow: number): void {
    const normalizedName = hallName.trim().toLowerCase();
    if (!normalizedName || rowCount <= 0 || seatsPerRow <= 0) {
      return;
    }

    try {
      const raw = localStorage.getItem(this.hallLayoutOverridesKey);
      const parsed = raw ? JSON.parse(raw) as Record<string, { rowCount: number; seatsPerRow: number }> : {};
      parsed[normalizedName] = { rowCount, seatsPerRow };
      localStorage.setItem(this.hallLayoutOverridesKey, JSON.stringify(parsed));
      localStorage.setItem('halls-updated', Date.now().toString());
    } catch {
      // Ignore localStorage write issues.
    }
  }

  private confirmReservationPayment(sessionId: string): void {
    this.loading = true;
    this.cinemaApi.confirmReservationPayment(sessionId).subscribe({
      next: () => {
        this.showMockPaymentPanel = false;
        this.pendingMockSessionId = '';
        this.pendingMockPayment = null;
        this.showReservationForm = false;
        this.editingReservationId = null;
        this.reservationForm = {
          seanceId: '',
          userId: '',
          numeroPlace: '',
          prix: 0,
          contenuId: '',
          salleId: '',
        };

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { module: 'reservations', paymentSuccess: null, sessionId: null, paymentCanceled: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });

        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, 'Payment was received but reservation confirmation failed.');
      },
    });
  }

  confirmMockPayment(): void {
    if (!this.validateMockPaymentInputs()) {
      return;
    }

    if (this.pendingMockSessionId) {
      this.confirmReservationPayment(this.pendingMockSessionId);
      return;
    }

    if (!this.pendingDirectReservationPayload) {
      this.error = 'No pending payment session found.';
      return;
    }

    this.loading = true;
    this.cinemaApi.createReservation(this.pendingDirectReservationPayload).subscribe({
      next: () => {
        this.loading = false;
        this.showMockPaymentPanel = false;
        this.pendingMockSessionId = '';
        this.pendingDirectReservationPayload = null;
        this.pendingMockPayment = null;
        this.resetMockPaymentInputs();
        this.showReservationForm = false;
        this.editingReservationId = null;
        this.reservationForm = {
          seanceId: '',
          userId: '',
          numeroPlace: '',
          prix: 0,
          contenuId: '',
          salleId: '',
        };
        this.loadAll();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.toErrorMessage(err, 'Failed to create reservation.');
      },
    });
  }

  cancelMockPayment(): void {
    this.showMockPaymentPanel = false;
    this.pendingMockSessionId = '';
    this.pendingDirectReservationPayload = null;
    this.pendingMockPayment = null;
    this.resetMockPaymentInputs();
    this.error = 'Payment canceled.';
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
        this.error = 'Card holder name is required.';
        return false;
      }

      const cleanCardNumber = this.mockCardNumber.replace(/\s+/g, '');
      if (!/^\d{16}$/.test(cleanCardNumber)) {
        this.error = 'Card number must contain exactly 16 digits.';
        return false;
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.mockCardExpiry.trim())) {
        this.error = 'Card expiry must be in MM/YY format.';
        return false;
      }

      if (!/^\d{3,4}$/.test(this.mockCardCvv.trim())) {
        this.error = 'CVV must contain 3 or 4 digits.';
        return false;
      }
    }

    if (this.mockPaymentMethod === 'paypal') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.mockPaypalEmail.trim())) {
        this.error = 'A valid PayPal email is required.';
        return false;
      }
    }

    this.error = null;
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
}


