package com.example.contentmanagement.config;

import com.example.contentmanagement.entity.*;
import com.example.contentmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final GenreRepository genreRepository;
    private final FilmRepository filmRepository;
    private final SeriesRepository seriesRepository;
    private final DocumentaryRepository documentaryRepository;
    private final ContentRepository contentRepository;
    private final CinemaRepository cinemaRepository;
    private final SalleRepository salleRepository;
    private final SeanceRepository seanceRepository;
    private final ReservationRepository reservationRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public void run(String... args) {
        log.info("Seeding demo operational data...");

        Map<String, User> users = loadUsers();
        Map<String, Genre> genres = seedGenres();
        Map<String, Content> contentByTitle = seedContentCatalog(genres, users.get("admin"));
        Map<String, Cinema> cinemas = seedCinemas();
        Map<String, Salle> salles = seedSalles();
        Map<String, Seance> seances = seedSeances(contentByTitle, cinemas, salles);
        seedReservations(users, contentByTitle, seances);
        seedNotifications(users);

        log.info("Demo operational data ready.");
    }

    private Map<String, User> loadUsers() {
        Map<String, User> users = new HashMap<>();
        for (String username : List.of("admin", "moderator", "publisher", "user", "viewer")) {
            userRepository.findByUsername(username).ifPresent(user -> users.put(username, user));
        }
        return users;
    }

    private Map<String, Genre> seedGenres() {
        Map<String, Genre> genres = new HashMap<>();
        registerGenre(genres, "Action", "High-energy content with combat and adventure", "#FF6B6B");
        registerGenre(genres, "Drama", "Emotional storytelling with character depth", "#4ECDC4");
        registerGenre(genres, "Comedy", "Humorous and entertaining content", "#FFE66D");
        registerGenre(genres, "Science Fiction", "Futuristic and speculative content", "#95E1D3");
        registerGenre(genres, "Thriller", "Suspenseful and intense storytelling", "#C7CEEA");
        registerGenre(genres, "Horror", "Scary and frightening content", "#BB4B4B");
        registerGenre(genres, "Nature", "Nature and wildlife storytelling", "#7BC67E");
        registerGenre(genres, "History", "Historical events and documentary storytelling", "#C58B5B");
        registerGenre(genres, "Society", "Stories about culture, technology, and social change", "#8B5CF6");
        return genres;
    }

    private void registerGenre(Map<String, Genre> genres, String name, String description, String color) {
        Genre genre = genreRepository.findByName(name)
                .orElseGet(() -> genreRepository.save(Genre.builder()
                        .name(name)
                        .description(description)
                        .color(color)
                        .build()));
        genres.put(name, genre);
    }

    private Map<String, Content> seedContentCatalog(Map<String, Genre> genres, User admin) {
        Map<String, Content> contentByTitle = new HashMap<>();

        contentByTitle.put("The Matrix", upsertFilm("The Matrix",
                "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
                LocalDateTime.of(1999, 3, 31, 0, 0), 1250,
                List.of(genres.get("Science Fiction"), genres.get("Action")),
                "Lana Wachowski, Lilly Wachowski", admin));

        contentByTitle.put("Inception", upsertFilm("Inception",
                "A skilled thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.",
                LocalDateTime.of(2010, 7, 16, 0, 0), 980,
                List.of(genres.get("Science Fiction"), genres.get("Thriller")),
                "Christopher Nolan", admin));

        contentByTitle.put("The Shawshank Redemption", upsertFilm("The Shawshank Redemption",
                "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
                LocalDateTime.of(1994, 10, 14, 0, 0), 1430,
                List.of(genres.get("Drama")),
                "Frank Darabont", admin));

        contentByTitle.put("Interstellar", upsertFilm("Interstellar",
                "Explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
                LocalDateTime.of(2014, 11, 7, 0, 0), 1480,
                List.of(genres.get("Science Fiction"), genres.get("Drama")),
                "Christopher Nolan", admin));

        contentByTitle.put("Breaking Bad", upsertSeries("Breaking Bad",
                "A chemistry teacher turned meth cook partners with a former student to produce crystal meth and secure his family's future.",
                LocalDateTime.of(2008, 1, 20, 0, 0), 1600,
                List.of(genres.get("Drama"), genres.get("Thriller")), 5, 62, true, admin));

        contentByTitle.put("The Office", upsertSeries("The Office",
                "A mockumentary series following the everyday lives of office employees at a paper supply company.",
                LocalDateTime.of(2005, 3, 24, 0, 0), 1100,
                List.of(genres.get("Comedy")), 9, 201, true, admin));

        contentByTitle.put("Stranger Things", upsertSeries("Stranger Things",
                "A group of kids uncover supernatural mysteries and secret experiments in their small town.",
                LocalDateTime.of(2016, 7, 15, 0, 0), 1350,
                List.of(genres.get("Science Fiction"), genres.get("Thriller")), 4, 34, false, admin));

        contentByTitle.put("Planet Earth", upsertDocumentary("Planet Earth",
                "A groundbreaking nature documentary series exploring the world's biodiversity and ecosystems.",
                LocalDateTime.of(2006, 3, 5, 0, 0), 890,
                List.of(genres.get("Nature")), "Natural World", "David Attenborough", admin));

        contentByTitle.put("Chernobyl: Inside the Zone", upsertDocumentary("Chernobyl: Inside the Zone",
                "A documentary look at the disaster, the recovery effort, and the people who lived through the aftermath.",
                LocalDateTime.of(2019, 6, 1, 0, 0), 1230,
                List.of(genres.get("History"), genres.get("Drama")), "Disaster History", "Jane Doe", admin));

        contentByTitle.put("The Social Dilemma", upsertDocumentary("The Social Dilemma",
                "An exploration of how social media can reshape behavior, attention, and public discourse.",
                LocalDateTime.of(2020, 1, 26, 0, 0), 760,
                List.of(genres.get("Society"), genres.get("Drama")), "Technology and Society", "Tristan Harris", admin));

        return contentByTitle;
    }

    private Film upsertFilm(String title, String description, LocalDateTime releaseDate, int viewCount, List<Genre> genreList, String director, User admin) {
        Film film = findFilm(title).orElseGet(Film::new);
        configureContent(film, title, description, releaseDate, ContentCategory.MOVIE, viewCount, genreList, ContentStatus.PUBLISHED);
        film.setContentType("FILM");
        film.setDirector(director);
        film.setDurationInMinutes(film.getDurationInMinutes() != null && film.getDurationInMinutes() > 0 ? film.getDurationInMinutes() : 120);
        film.setAddedBy(admin);
        return filmRepository.save(film);
    }

    private Series upsertSeries(String title, String description, LocalDateTime releaseDate, int viewCount, List<Genre> genreList, int seasons, int episodes, boolean completed, User admin) {
        Series series = findSeries(title).orElseGet(Series::new);
        configureContent(series, title, description, releaseDate, ContentCategory.SERIES, viewCount, genreList, ContentStatus.PUBLISHED);
        series.setContentType("SERIES");
        series.setNumberOfSeasons(seasons);
        series.setNumberOfEpisodes(episodes);
        series.setIsCompleted(completed);
        series.setAddedBy(admin);
        return seriesRepository.save(series);
    }

    private Documentary upsertDocumentary(String title, String description, LocalDateTime releaseDate, int viewCount, List<Genre> genreList, String topic, String narrator, User admin) {
        Documentary documentary = findDocumentary(title).orElseGet(Documentary::new);
        configureContent(documentary, title, description, releaseDate, ContentCategory.DOCUMENTARY, viewCount, genreList, ContentStatus.PUBLISHED);
        documentary.setContentType("DOCUMENTARY");
        documentary.setTopic(topic);
        documentary.setNarrator(narrator);
        documentary.setAddedBy(admin);
        return documentaryRepository.save(documentary);
    }

    private void configureContent(Content content, String title, String description, LocalDateTime releaseDate, ContentCategory category, int viewCount, List<Genre> genreList, ContentStatus status) {
        content.setTitle(title);
        content.setDescription(description);
        content.setReleaseDate(releaseDate);
        content.setPublishAt(releaseDate);
        content.setPublishedAt(releaseDate);
        content.setCategory(category);
        content.setStatus(status);
        content.setVisible(Boolean.TRUE);
        content.setViewCount(viewCount);
        content.setGenreIds(genreList.stream()
                .filter(java.util.Objects::nonNull)
                .map(Genre::getId)
                .toList());
    }

    private Map<String, Cinema> seedCinemas() {
        Map<String, Cinema> cinemas = new HashMap<>();
        cinemas.put("CineNova", upsertCinema("CineNova", "12 Avenue des Lumières", "Tunis"));
        cinemas.put("Galaxy Screens", upsertCinema("Galaxy Screens", "8 Boulevard Central", "Sousse"));
        return cinemas;
    }

    private Cinema upsertCinema(String nom, String adresse, String ville) {
        Cinema cinema = cinemaRepository.findAll().stream()
                .filter(item -> nom.equalsIgnoreCase(item.getNom()))
                .findFirst()
                .orElseGet(Cinema::new);
        cinema.setNom(nom);
        cinema.setAdresse(adresse);
        cinema.setVille(ville);
        return cinemaRepository.save(cinema);
    }

    private Map<String, Salle> seedSalles() {
        Map<String, Salle> salles = new HashMap<>();
        salles.put("Alpha", upsertSalle("Alpha", 156));
        salles.put("Beta", upsertSalle("Beta", 104));
        salles.put("Gamma", upsertSalle("Gamma", 72));
        return salles;
    }

    private Salle upsertSalle(String name, int capacity) {
        Salle salle = salleRepository.findAll().stream()
                .filter(item -> name.equalsIgnoreCase(item.getName()))
                .findFirst()
                .orElseGet(Salle::new);
        salle.setName(name);
        salle.setCapacity(capacity);
        return salleRepository.save(salle);
    }

    private Map<String, Seance> seedSeances(Map<String, Content> contentByTitle, Map<String, Cinema> cinemas, Map<String, Salle> salles) {
        Map<String, Seance> seances = new HashMap<>();
        seances.put("Matrix-Prime", upsertSeance(LocalDate.now().plusDays(1), "19:30", salles.get("Alpha"), cinemas.get("CineNova"), contentByTitle.get("The Matrix")));
        seances.put("Breaking-Bad-Night", upsertSeance(LocalDate.now().plusDays(1), "21:15", salles.get("Beta"), cinemas.get("CineNova"), contentByTitle.get("Breaking Bad")));
        seances.put("Interstellar-Special", upsertSeance(LocalDate.now().plusDays(2), "18:00", salles.get("Gamma"), cinemas.get("Galaxy Screens"), contentByTitle.get("Interstellar")));
        return seances;
    }

    private Seance upsertSeance(LocalDate dateSeance, String heureSeance, Salle salle, Cinema cinema, Content content) {
        Seance seance = seanceRepository.findAll().stream()
                .filter(item -> heureSeance.equals(item.getHeureSeance())
                        && dateSeance.equals(item.getDateSeance())
                        && salle != null && salle.getId().equals(item.getSalle()))
                .findFirst()
                .orElseGet(Seance::new);
        seance.setDateSeance(dateSeance);
        seance.setHeureSeance(heureSeance);
        seance.setSalle(salle != null ? salle.getId() : null);
        seance.setCinemaId(cinema != null ? cinema.getId() : null);
        seance.setContenuId(content != null ? content.getId() : null);
        return seanceRepository.save(seance);
    }

    private void seedReservations(Map<String, User> users, Map<String, Content> contentByTitle, Map<String, Seance> seances) {
        upsertReservation(users.get("user"), contentByTitle.get("The Matrix"), seances.get("Matrix-Prime"), "A12", 28.0);
        upsertReservation(users.get("user"), contentByTitle.get("Breaking Bad"), seances.get("Breaking-Bad-Night"), "B08", 24.5);
        upsertReservation(users.get("publisher"), contentByTitle.get("Interstellar"), seances.get("Interstellar-Special"), "C03", 31.0);
        upsertReservation(users.get("moderator"), contentByTitle.get("The Office"), seances.get("Breaking-Bad-Night"), "D10", 22.0);
    }

    private Reservation upsertReservation(User user, Content content, Seance seance, String seat, double price) {
        if (user == null || content == null || seance == null) {
            return null;
        }

        Optional<Reservation> existing = reservationRepository.findAll().stream()
                .filter(item -> seat.equals(item.getNumeroPlace())
                        && content.getId().equals(item.getContenuId())
                        && seance.getId().equals(item.getSeanceId()))
                .findFirst();

        Reservation reservation = existing.orElseGet(Reservation::new);
        reservation.setDateReservation(new Date());
        reservation.setNumeroPlace(seat);
        reservation.setStatut("CONFIRMEE");
        reservation.setContenuId(content.getId());
        reservation.setUserId(user.getId());
        reservation.setPrix(price);
        reservation.setSeanceId(seance.getId());
        return reservationRepository.save(reservation);
    }

    private void seedNotifications(Map<String, User> users) {
        User user = users.get("user");
        User admin = users.get("admin");
        User publisher = users.get("publisher");

        if (user != null) {
            upsertNotification(user, "In-app alert queued", "We will send email follow-up if this stays unread for 6 hours.", "INFO", false);
            upsertNotification(user, "Top recommendation ready", "The AI engine ranked The Matrix and Interstellar highest for you.", "SUCCESS", false);
        }
        if (admin != null) {
            upsertNotification(admin, "Content analytics refreshed", "Top 10 ranking now has enough seed data to test the dashboard.", "INFO", true);
        }
        if (publisher != null) {
            upsertNotification(publisher, "Cinema reservation confirmed", "Your seat for Interstellar was reserved for the demo schedule.", "SUCCESS", true);
        }
    }

    private Notification upsertNotification(User user, String title, String message, String type, boolean read) {
        Optional<Notification> existing = notificationRepository.findAll().stream()
                .filter(item -> item.getUser() != null
                        && user.getId().equals(item.getUser().getId())
                        && title.equalsIgnoreCase(Optional.ofNullable(item.getTitle()).orElse("")))
                .findFirst();

        Notification notification = existing.orElseGet(Notification::new);
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setIsRead(read);
        return notificationRepository.save(notification);
    }

    private Optional<Film> findFilm(String title) {
        return filmRepository.findAll().stream().filter(item -> title.equalsIgnoreCase(item.getTitle())).findFirst();
    }

    private Optional<Series> findSeries(String title) {
        return seriesRepository.findAll().stream().filter(item -> title.equalsIgnoreCase(item.getTitle())).findFirst();
    }

    private Optional<Documentary> findDocumentary(String title) {
        return documentaryRepository.findAll().stream().filter(item -> title.equalsIgnoreCase(item.getTitle())).findFirst();
    }
}