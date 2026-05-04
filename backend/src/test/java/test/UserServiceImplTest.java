package test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.contentmanagement.dto.UserDTO;
import com.example.contentmanagement.exception.DuplicateResourceException;
import com.example.contentmanagement.repository.RoleRepository;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.service.impl.UserServiceImpl;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void createUser_encryptsPasswordAndSetsDefaultRole() {
        UserDTO userDTO = UserDTO.builder()
                .username("john")
                .email("john@example.com")
                .password("secret123")
                .build();

        when(userRepository.findByUsername("john")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-secret");
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserDTO created = userService.createUser(userDTO);

        assertEquals("john", created.getUsername());
        assertEquals("john@example.com", created.getEmail());
        assertNotNull(created.getCreatedAt());
    }

    @Test
    void createUser_throwsWhenUsernameAlreadyExists() {
        UserDTO userDTO = UserDTO.builder()
                .username("taken")
                .email("taken@example.com")
                .password("secret123")
                .build();

        when(userRepository.findByUsername("taken")).thenReturn(Optional.of(new com.example.contentmanagement.entity.User()));

        assertThrows(DuplicateResourceException.class, () -> userService.createUser(userDTO));
    }
}
