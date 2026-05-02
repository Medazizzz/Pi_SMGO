package com.example.contentmanagement.config;

import com.example.contentmanagement.security.CustomUserDetailsService;
import com.example.contentmanagement.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


import java.util.Arrays;

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

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

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

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests((authorize) ->
                        authorize
                                // accès public aux fichiers audio/image uploadés
                                .requestMatchers("/uploads/**").permitAll()

                                // endpoints publics
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
                                .requestMatchers("/ws-watchparty/**").permitAll()

                                // sécurisé
                                .requestMatchers("/feedback/**").authenticated()

                                .requestMatchers("/api/uploads/**", "/uploads/**").permitAll()

                                .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                .requestMatchers("/ws-watchparty/**");
    }
}