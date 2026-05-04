import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CinemaRequestDTO {
  nom: string;
  adresse: string;
  ville: string;
}

export interface CinemaResponseDTO extends CinemaRequestDTO {
  id: string;
}

export interface SalleRequestDTO {
  name: string;
  capacity: number;
}

export interface SalleResponseDTO extends SalleRequestDTO {
  id: string;
}

export interface SeanceRequestDTO {
  dateSeance: string;
  heureSeance: string;
  salleId: string;
  cinemaId: string;
  contenuId?: string;
}

export interface SeanceResponseDTO {
  id: string;
  dateSeance: string;
  heureSeance: string;
  numeroSalle: string;
  nomCinema: string;
  contenuId?: string;
}

export interface ReservationRequestDTO {
  seanceId: string;
  userId: string;
  numeroPlace: string;
  prix: number;
  contenuId?: string;
  watchPartyId?: string;
}

export interface ReservationResponseDTO {
  id: string;
  dateReservation: string;
  numeroPlace: string;
  statut: string;
  prix: number;
  userId: string;
  contenuId?: string;
  nomCinema: string;
  numeroSalle: string;
  dateSeance: string;
  heureSeance: string;
}

@Injectable({
  providedIn: 'root',
})
export class CinemaApiService {
  private readonly baseUrl = 'http://localhost:8090/api';

  constructor(private readonly http: HttpClient) {}

  getCinemas(): Observable<CinemaResponseDTO[]> {
    return this.http.get<CinemaResponseDTO[]>(`${this.baseUrl}/cinemas`);
  }

  createCinema(payload: CinemaRequestDTO): Observable<CinemaResponseDTO> {
    return this.http.post<CinemaResponseDTO>(`${this.baseUrl}/cinemas`, payload);
  }

  updateCinema(id: string, payload: CinemaRequestDTO): Observable<CinemaResponseDTO> {
    return this.http.put<CinemaResponseDTO>(`${this.baseUrl}/cinemas/${id}`, payload);
  }

  deleteCinema(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cinemas/${id}`);
  }

  getSalles(): Observable<SalleResponseDTO[]> {
    return this.http.get<SalleResponseDTO[]>(`${this.baseUrl}/salles`);
  }

  createSalle(payload: SalleRequestDTO): Observable<SalleResponseDTO> {
    return this.http.post<SalleResponseDTO>(`${this.baseUrl}/salles`, payload);
  }

  updateSalle(id: string, payload: SalleRequestDTO): Observable<SalleResponseDTO> {
    return this.http.put<SalleResponseDTO>(`${this.baseUrl}/salles/${id}`, payload);
  }

  deleteSalle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/salles/${id}`);
  }

  getSeances(): Observable<SeanceResponseDTO[]> {
    return this.http.get<SeanceResponseDTO[]>(`${this.baseUrl}/seances`);
  }

  getSeancesByCinema(cinemaId: string): Observable<SeanceResponseDTO[]> {
    return this.http.get<SeanceResponseDTO[]>(`${this.baseUrl}/seances/cinema/${cinemaId}`);
  }

  createSeance(payload: SeanceRequestDTO): Observable<SeanceResponseDTO> {
    return this.http.post<SeanceResponseDTO>(`${this.baseUrl}/seances`, payload);
  }

  updateSeance(id: string, payload: SeanceRequestDTO): Observable<SeanceResponseDTO> {
    return this.http.put<SeanceResponseDTO>(`${this.baseUrl}/seances/${id}`, payload);
  }

  deleteSeance(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/seances/${id}`);
  }

  getReservations(): Observable<ReservationResponseDTO[]> {
    return this.http.get<ReservationResponseDTO[]>(`${this.baseUrl}/reservations`);
  }

  getReservationsByUser(userId: string): Observable<ReservationResponseDTO[]> {
    return this.http.get<ReservationResponseDTO[]>(`${this.baseUrl}/reservations/user/${userId}`);
  }

  createReservation(payload: ReservationRequestDTO): Observable<ReservationResponseDTO> {
    return this.http.post<ReservationResponseDTO>(`${this.baseUrl}/reservations`, payload);
  }

  updateReservation(id: string, payload: ReservationRequestDTO): Observable<ReservationResponseDTO> {
    return this.http.put<ReservationResponseDTO>(`${this.baseUrl}/reservations/${id}`, payload);
  }

  deleteReservation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/reservations/${id}`);
  }
}
