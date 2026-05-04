package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.CinemaRequestDTO;
import com.example.contentmanagement.dto.CinemaResponseDTO;
import com.example.contentmanagement.entity.Cinema;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.CinemaRepository;
import com.example.contentmanagement.service.CinemaService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CinemaServiceImpl implements CinemaService {

    private static final String NOMINATIM_USER_AGENT = "ShowMatchGoOn/1.0 (nearest-cinema backend)";

    private final CinemaRepository cinemaRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public CinemaResponseDTO create(CinemaRequestDTO request) {
        Cinema cinema = Cinema.builder()
                .nom(request.getNom())
                .adresse(request.getAdresse())
                .ville(request.getVille())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();
        resolveAndPersistCoordinates(cinema, request.getNom(), request.getAdresse(), request.getVille());
        return toResponse(cinemaRepository.save(cinema));
    }

    @Override
    public CinemaResponseDTO findById(String id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + id));
        return toResponse(cinema);
    }

    @Override
    public List<CinemaResponseDTO> findAll() {
        return cinemaRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public CinemaResponseDTO update(String id, CinemaRequestDTO request) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + id));
        cinema.setNom(request.getNom());
        cinema.setAdresse(request.getAdresse());
        cinema.setVille(request.getVille());
        cinema.setLatitude(request.getLatitude());
        cinema.setLongitude(request.getLongitude());
        resolveAndPersistCoordinates(cinema, request.getNom(), request.getAdresse(), request.getVille());
        return toResponse(cinemaRepository.save(cinema));
    }

    @Override
    public void deleteById(String id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cinema not found with id: " + id));
        cinemaRepository.delete(cinema);
    }

    @Override
    public CinemaResponseDTO findNearestCinema(double latitude, double longitude) {
        List<CinemaCandidate> candidates = cinemaRepository.findAll().stream()
                .map(cinema -> resolveCoordinates(cinema)
                .map(coordinates -> new CinemaCandidate(cinema, coordinates.latitude(), coordinates.longitude(), 0.0))
                        .orElse(null))
                .filter(candidate -> candidate != null)
                .map(candidate -> candidate.withDistance(distanceKm(latitude, longitude, candidate.latitude(), candidate.longitude())))
                .sorted(Comparator.comparingDouble(CinemaCandidate::distanceKm))
                .toList();

        CinemaCandidate nearest = candidates.stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No cinema with resolvable coordinates found."));

        return toResponse(nearest.cinema(), nearest.distanceKm());
    }

    private CinemaResponseDTO toResponse(Cinema cinema) {
        return toResponse(cinema, null);
    }

    private CinemaResponseDTO toResponse(Cinema cinema, Double distanceKm) {
        return CinemaResponseDTO.builder()
                .id(cinema.getId())
                .nom(cinema.getNom())
                .adresse(cinema.getAdresse())
                .ville(cinema.getVille())
                .latitude(cinema.getLatitude())
                .longitude(cinema.getLongitude())
                .distanceKm(distanceKm)
                .build();
    }

    private void resolveAndPersistCoordinates(Cinema cinema, String nom, String adresse, String ville) {
        if (isValidCoordinate(cinema.getLatitude(), cinema.getLongitude())) {
            return;
        }

        resolveCoordinatesFromAddress(nom, adresse, ville).ifPresent(coordinates -> {
            cinema.setLatitude(coordinates.latitude());
            cinema.setLongitude(coordinates.longitude());
        });
    }

    private Optional<Coordinates> resolveCoordinates(Cinema cinema) {
        if (isValidCoordinate(cinema.getLatitude(), cinema.getLongitude())) {
            return Optional.of(new Coordinates(cinema.getLatitude(), cinema.getLongitude()));
        }

        Optional<Coordinates> resolved = resolveCoordinatesFromAddress(cinema.getNom(), cinema.getAdresse(), cinema.getVille());
        resolved.ifPresent(coordinates -> {
            cinema.setLatitude(coordinates.latitude());
            cinema.setLongitude(coordinates.longitude());
            cinemaRepository.save(cinema);
        });
        return resolved;
    }

    private Optional<Coordinates> resolveCoordinatesFromAddress(String nom, String adresse, String ville) {
        String query = Stream.of(nom, adresse, ville)
            .filter(value -> value != null && !value.isBlank())
            .reduce((left, right) -> left + ", " + right)
            .orElse("");
        if (query.isBlank()) {
            return Optional.empty();
        }

        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + encodedQuery;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(12))
                    .header("Accept", "application/json")
                    .header("User-Agent", NOMINATIM_USER_AGENT)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            if (!root.isArray() || root.isEmpty()) {
                return Optional.empty();
            }

            JsonNode first = root.get(0);
            double latitude = first.path("lat").asDouble(Double.NaN);
            double longitude = first.path("lon").asDouble(Double.NaN);
            if (Double.isNaN(latitude) || Double.isNaN(longitude)) {
                return Optional.empty();
            }

            return Optional.of(new Coordinates(latitude, longitude));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (IOException ex) {
            return Optional.empty();
        }
    }

    private boolean isValidCoordinate(Double latitude, Double longitude) {
        return latitude != null && longitude != null
                && latitude >= -90.0 && latitude <= 90.0
                && longitude >= -180.0 && longitude <= 180.0;
    }

    private double distanceKm(double latitude1, double longitude1, double latitude2, double longitude2) {
        double earthRadiusKm = 6371.0;
        double deltaLatitude = Math.toRadians(latitude2 - latitude1);
        double deltaLongitude = Math.toRadians(longitude2 - longitude1);
        double a = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2)
                + Math.cos(Math.toRadians(latitude1)) * Math.cos(Math.toRadians(latitude2))
                * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
        return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private record Coordinates(double latitude, double longitude) { }

    private record CinemaCandidate(Cinema cinema, double latitude, double longitude, double distanceKm) {
        private CinemaCandidate withDistance(double distanceKm) {
            return new CinemaCandidate(cinema, latitude, longitude, distanceKm);
        }
    }
}
