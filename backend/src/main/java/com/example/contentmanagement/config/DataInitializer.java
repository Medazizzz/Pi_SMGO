package com.example.contentmanagement.config;

import com.example.contentmanagement.entity.*;
import com.example.contentmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final GenreRepository genreRepository;
    private final ContentRepository contentRepository;
    private final FilmRepository filmRepository;
    private final SeriesRepository seriesRepository;
    private final DocumentaryRepository documentaryRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        initializeRolesAndUsers();
        initializeCategories();
        initializeGenresAndContent();
    }

    private void initializeRolesAndUsers() {
        log.info("Ensuring default roles and demo users...");

        Role adminRole = ensureRole(
                "ADMIN",
                "Administrator with full system access",
                Set.of(
                        "user:create", "user:read", "user:update", "user:delete",
                        "role:create", "role:read", "role:update", "role:delete",
                        "content:create", "content:read", "content:update", "content:delete",
                        "category:create", "category:read", "category:update", "category:delete",
                        "system:manage"
                )
        );

        Role moderatorRole = ensureRole(
                "MODERATOR",
                "Moderator with content management permissions",
                Set.of(
                        "content:read", "content:update", "content:delete",
                        "comment:moderate", "user:manage"
                )
        );

        Role publisherRole = ensureRole(
                "PUBLISHER",
                "Publisher with content creation permissions",
                Set.of(
                        "content:create", "content:read", "content:update",
                        "category:read"
                )
        );

        Role userRole = ensureRole(
                "USER",
                "Regular user with basic permissions",
                Set.of("content:read", "profile:update")
        );

        Role viewerRole = ensureRole(
                "VIEWER",
                "Viewer with read-only access",
                Set.of("content:read")
        );

        // Idempotent user bootstrap for fresh clones and partially initialized DBs.
        ensureDemoUser("admin", "admin@smgo.local", "Admin@1234", adminRole);
        ensureDemoUser("moderator", "moderator@smgo.local", "Moderator@1234", moderatorRole);
        ensureDemoUser("publisher", "publisher@smgo.local", "Publisher@1234", publisherRole);
        ensureDemoUser("user", "user@smgo.local", "User@1234", userRole);
        ensureDemoUser("viewer", "viewer@smgo.local", "Viewer@1234", viewerRole);

        log.info("✓ Default accounts ready: admin/admin@smgo.local, user/user@smgo.local");
    }

    private Role ensureRole(String name, String description, Set<String> permissions) {
        return roleRepository.findByName(name)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(name)
                        .description(description)
                        .permissions(permissions)
                        .createdAt(LocalDateTime.now())
                        .build()));
    }

    private void ensureDemoUser(String username, String email, String password, Role role) {
        userRepository.findByUsername(username).ifPresentOrElse(existing -> {
            boolean needsUpdate = false;

            if (existing.getRole() == null || !existing.getRole().equals(role.getName())) {
                existing.setRole(role.getName());
                needsUpdate = true;
            }

            if (existing.getRoles() == null || existing.getRoles().isEmpty()) {
                existing.setRoles(Set.of(role));
                needsUpdate = true;
            }

            if (!existing.isEnabled()) {
                existing.setEnabled(true);
                needsUpdate = true;
            }

            if (needsUpdate) {
                existing.setUpdatedAt(LocalDateTime.now());
                userRepository.save(existing);
            }
        }, () -> {
            User user = User.builder()
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .enabled(true)
                    .role(role.getName())
                    .roles(Set.of(role))
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepository.save(user);
        });
    }

    private void initializeCategories() {
        if (categoryRepository.count() == 0) {
            log.info("Initializing default categories...");

            Category movieCategory = categoryRepository.save(Category.builder()
                    .name("Movie")
                    .description("All movie categories")
                    .contentType("MOVIE")
                    .build());
            log.info("✓ Created Movie category: {}", movieCategory.getId());

            Category seriesCategory = categoryRepository.save(Category.builder()
                    .name("Series")
                    .description("All series categories")
                    .contentType("SERIES")
                    .build());
            log.info("✓ Created Series category: {}", seriesCategory.getId());

            Category documentaryCategory = categoryRepository.save(Category.builder()
                    .name("Documentary")
                    .description("All documentary categories")
                    .contentType("DOCUMENTARY")
                    .build());
            log.info("✓ Created Documentary category: {}", documentaryCategory.getId());

            log.info("✓ Created 3 default categories");
        } else {
            log.info("Categories already exist. Skipping category initialization.");
        }
    }

    private void initializeGenresAndContent() {
        try {
            log.info("Initializing genres and content...");
            
            // Create genres if they don't exist
            if (genreRepository.count() == 0) {
                log.info("Creating genres...");
                Genre actionGenre = genreRepository.save(Genre.builder()
                        .name("Action")
                        .description("High-energy content with combat and adventure")
                        .color("#FF6B6B")
                        .build());
                log.info("Created Action genre: {}", actionGenre.getId());

                Genre dramaGenre = genreRepository.save(Genre.builder()
                        .name("Drama")
                        .description("Emotional storytelling with character depth")
                        .color("#4ECDC4")
                        .build());
                log.info("Created Drama genre: {}", dramaGenre.getId());

                Genre comedyGenre = genreRepository.save(Genre.builder()
                        .name("Comedy")
                        .description("Humorous and entertaining content")
                        .color("#FFE66D")
                        .build());
                log.info("Created Comedy genre: {}", comedyGenre.getId());

                Genre scienceGenre = genreRepository.save(Genre.builder()
                        .name("Science Fiction")
                        .description("Futuristic and speculative content")
                        .color("#95E1D3")
                        .build());
                log.info("Created Science Fiction genre: {}", scienceGenre.getId());

                Genre thrillerGenre = genreRepository.save(Genre.builder()
                        .name("Thriller")
                        .description("Suspenseful and intense storytelling")
                        .color("#C7CEEA")
                        .build());
                log.info("Created Thriller genre: {}", thrillerGenre.getId());

                Genre horrorGenre = genreRepository.save(Genre.builder()
                        .name("Horror")
                        .description("Scary and frightening content")
                        .color("#BB4B4B")
                        .build());
                log.info("Created Horror genre: {}", horrorGenre.getId());

                log.info("✓ Created 6 genres");
            } else {
                log.info("Genres already exist. Skipping genre creation.");
            }

            // Create content if it doesn't exist
            if (contentRepository.count() == 0) {
                log.info("Creating content...");
                User admin = userRepository.findByUsername("admin").orElse(null);
                log.info("Admin user: {}", admin != null ? admin.getUsername() : "NOT FOUND");
                
                // Retrieve genres from database by name
                log.info("Retrieving genres from database...");
                Genre actionGenre = genreRepository.findByName("Action").orElse(null);
                log.info("Action genre: {}", actionGenre != null ? actionGenre.getName() : "NOT FOUND");
                
                Genre dramaGenre = genreRepository.findByName("Drama").orElse(null);
                log.info("Drama genre: {}", dramaGenre != null ? dramaGenre.getName() : "NOT FOUND");
                
                Genre comedyGenre = genreRepository.findByName("Comedy").orElse(null);
                log.info("Comedy genre: {}", comedyGenre != null ? comedyGenre.getName() : "NOT FOUND");
                
                Genre scienceGenre = genreRepository.findByName("Science Fiction").orElse(null);
                log.info("Science Fiction genre: {}", scienceGenre != null ? scienceGenre.getName() : "NOT FOUND");
                
                Genre thrillerGenre = genreRepository.findByName("Thriller").orElse(null);
                log.info("Thriller genre: {}", thrillerGenre != null ? thrillerGenre.getName() : "NOT FOUND");

                // Create Films
                Film film1 = new Film();
                film1.setTitle("The Matrix");
                film1.setDescription("A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.");
                film1.setReleaseDate(LocalDateTime.of(1999, 3, 31, 0, 0));
                film1.setCategory(ContentCategory.MOVIE);
                if (scienceGenre != null && actionGenre != null) {
                    film1.setGenreIds(Arrays.asList(scienceGenre.getId(), actionGenre.getId()));
                }
                film1.setAddedBy(admin);
                film1.setDurationInMinutes(136);
                film1.setDirector("Lana Wachowski, Lilly Wachowski");
                filmRepository.save(film1);
                log.info("Created film: The Matrix");

                Film film2 = new Film();
                film2.setTitle("Inception");
                film2.setDescription("A skilled thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.");
                film2.setReleaseDate(LocalDateTime.of(2010, 7, 16, 0, 0));
                film2.setCategory(ContentCategory.MOVIE);
                if (scienceGenre != null && actionGenre != null) {
                    film2.setGenreIds(Arrays.asList(scienceGenre.getId(), actionGenre.getId()));
                }
                film2.setAddedBy(admin);
                film2.setDurationInMinutes(148);
                film2.setDirector("Christopher Nolan");
                filmRepository.save(film2);
                log.info("Created film: Inception");

                Film film3 = new Film();
                film3.setTitle("The Shawshank Redemption");
                film3.setDescription("Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.");
                film3.setReleaseDate(LocalDateTime.of(1994, 10, 14, 0, 0));
                film3.setCategory(ContentCategory.MOVIE);
                if (dramaGenre != null) {
                    film3.setGenreIds(Arrays.asList(dramaGenre.getId()));
                }
                film3.setAddedBy(admin);
                film3.setDurationInMinutes(142);
                film3.setDirector("Frank Darabont");
                filmRepository.save(film3);
                log.info("Created film: The Shawshank Redemption");

                log.info("✓ Created 3 films");

                // Create Series
                Series series1 = new Series();
                series1.setTitle("Breaking Bad");
                series1.setDescription("A chemistry teacher turned meth cook partners with a former student to produce crystal meth and secure his family's financial future.");
                series1.setReleaseDate(LocalDateTime.of(2008, 1, 20, 0, 0));
                series1.setCategory(ContentCategory.SERIES);
                if (dramaGenre != null && thrillerGenre != null) {
                    series1.setGenreIds(Arrays.asList(dramaGenre.getId(), thrillerGenre.getId()));
                }
                series1.setAddedBy(admin);
                series1.setNumberOfSeasons(5);
                series1.setNumberOfEpisodes(62);
                series1.setIsCompleted(true);
                seriesRepository.save(series1);
                log.info("Created series: Breaking Bad");

                Series series2 = new Series();
                series2.setTitle("The Office");
                series2.setDescription("A mockumentary series following the everyday lives of office employees at a paper supply company.");
                series2.setReleaseDate(LocalDateTime.of(2005, 3, 24, 0, 0));
                series2.setCategory(ContentCategory.SERIES);
                if (comedyGenre != null) {
                    series2.setGenreIds(Arrays.asList(comedyGenre.getId()));
                }
                series2.setAddedBy(admin);
                series2.setNumberOfSeasons(9);
                series2.setNumberOfEpisodes(201);
                series2.setIsCompleted(true);
                seriesRepository.save(series2);
                log.info("Created series: The Office");

                log.info("✓ Created 2 series");

                // Create Documentaries
                Documentary doc1 = new Documentary();
                doc1.setTitle("Planet Earth");
                doc1.setDescription("A groundbreaking nature documentary series exploring the world's biodiversity and ecosystems.");
                doc1.setReleaseDate(LocalDateTime.of(2006, 3, 5, 0, 0));
                doc1.setCategory(ContentCategory.DOCUMENTARY);
                doc1.setGenreIds(Arrays.asList());
                doc1.setAddedBy(admin);
                doc1.setTopic("Natural World");
                doc1.setNarrator("David Attenborough");
                documentaryRepository.save(doc1);
                log.info("Created documentary: Planet Earth");

                log.info("✓ Created 1 documentary");
                log.info("✅ Backend initialization complete!");
            } else {
                log.info("Content already exists. Skipping content creation.");
            }
            log.info("\n╔════════════════════════════════════════╗");
            log.info("║  ✅ APPLICATION STARTED SUCCESSFULLY   ║");
            log.info("║     Server: http://localhost:8090     ║");
            log.info("╚════════════════════════════════════════╝\n");
        } catch (Exception e) {
            log.error("Error during initialization", e);
            e.printStackTrace();
        }
    }
}
