package test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.contentmanagement.dto.AuthRequest;
import com.example.contentmanagement.dto.AuthResponse;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.security.JwtTokenProvider;
import com.example.contentmanagement.service.impl.AuthenticationServiceImpl;
import com.example.contentmanagement.service.UserService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    @Test
    void register_throwsWhenEmailIsMissing() {
        AuthRequest request = AuthRequest.builder()
                .username("tester")
                .password("secret123")
                .email("")
                .build();

        assertThrows(IllegalArgumentException.class, () -> authenticationService.register(request));
    }

    @Test
    void login_returnsTokenAndUserDataOnSuccess() {
        AuthRequest request = AuthRequest.builder()
                .username("john")
                .password("secret123")
                .build();

        User user = User.builder()
                .id("u-1")
                .username("john")
                .email("john@example.com")
                .role("ADMIN")
                .enabled(true)
                .locked(false)
                .build();

        Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername("john")
                .password("encoded")
                .authorities("ROLE_ADMIN")
                .build();

        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(jwtTokenProvider.generateToken(principal)).thenReturn("jwt-token");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authenticationService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals("john", response.getUsername());
        assertEquals("ADMIN", response.getRole());
        verify(userRepository).save(any(User.class));
    }
}
