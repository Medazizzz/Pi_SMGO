package com.example.contentmanagement.config;

import com.example.contentmanagement.security.CustomUserDetailsService;
import com.example.contentmanagement.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Security Configuration
 * WHY: Configures Spring Security with JWT authentication and CORS
 * Enables stateless API authentication suitable for single-page applications
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(
        securedEnabled = true,
        jsr250Enabled = true,
        prePostEnabled = true
)
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * JWT Authentication Filter Bean
     * WHY: Enables stateless JWT-based authentication for API endpoints
     */
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    /**
     * CORS Configuration Bean
     * WHY: Allows frontend (Angular) running on different origin to make API calls
     * Configures allowed origins, methods, headers, and credentials
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Security Filter Chain Configuration
     * WHY: Defines endpoint security rules and enables JWT authentication
     * Uses permits via HttpSecurity#authorizeHttpRequests (Spring Security 6+ recommended approach)
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS with our configuration
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Disable CSRF for stateless JWT auth
                .csrf(AbstractHttpConfigurer::disable)
                // Set session policy to stateless (no server-side sessions)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Authorization rules - public endpoints permitAll, others require authentication
                .authorizeHttpRequests((authorize) ->
                        authorize
                                // Public endpoints - no authentication required
                                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**", "/api-docs/**").permitAll()
                                .requestMatchers("/api/auth/**").permitAll()
                                .requestMatchers("/auth/**").permitAll()
                                .requestMatchers("/api/contents", "/api/contents/**").permitAll()
                                .requestMatchers("/api/categories", "/api/categories/**").permitAll()
                                .requestMatchers("/api/genres", "/api/genres/**").permitAll()
                                .requestMatchers("/api/notifications", "/api/notifications/**").permitAll()
                                .requestMatchers("/api/users", "/api/users/**").permitAll()
                                .requestMatchers("/api/roles", "/api/roles/**").permitAll()
                                .requestMatchers("/api/abonnements", "/api/abonnements/**").permitAll()
                                .requestMatchers("/api/fidelities", "/api/fidelities/**").permitAll()
                                .requestMatchers("/api/cinemas", "/api/cinemas/**").permitAll()
                                .requestMatchers("/api/salles", "/api/salles/**").permitAll()
                                .requestMatchers("/api/seances", "/api/seances/**").permitAll()
                                .requestMatchers("/api/reservations", "/api/reservations/**").permitAll()
                                .requestMatchers("/api/posts", "/api/posts/**").permitAll()
                                .requestMatchers("/api/commentaires", "/api/commentaires/**").permitAll()
                                .requestMatchers("/api/promotions", "/api/promotions/**").permitAll()
                                .requestMatchers("/watchparty/**").permitAll()
                                .requestMatchers("/feedback/**").permitAll()
                                // All other requests require authentication
                                .anyRequest().authenticated()
                )
                // Add JWT filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}


