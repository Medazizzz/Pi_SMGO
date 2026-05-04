package test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.contentmanagement.dto.RoleDTO;
import com.example.contentmanagement.entity.Role;
import com.example.contentmanagement.exception.DuplicateResourceException;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.repository.RoleRepository;
import com.example.contentmanagement.service.impl.RoleServiceImpl;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RoleServiceImplTest {

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private RoleServiceImpl roleService;

    @Test
    void createRole_savesRoleWhenNameIsUnique() {
        RoleDTO input = RoleDTO.builder()
                .name("ADMIN")
                .description("Administrator")
                .permissions(Set.of("users:read"))
                .build();

        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.empty());
        when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> {
            Role role = invocation.getArgument(0);
            role.setId("role-1");
            return role;
        });

        RoleDTO result = roleService.createRole(input);

        assertEquals("role-1", result.getId());
        assertEquals("ADMIN", result.getName());
        assertEquals("Administrator", result.getDescription());
    }

    @Test
    void createRole_throwsWhenRoleAlreadyExists() {
        RoleDTO input = RoleDTO.builder().name("ADMIN").build();
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(new Role()));

        assertThrows(DuplicateResourceException.class, () -> roleService.createRole(input));
    }

    @Test
    void deleteRole_throwsWhenRoleDoesNotExist() {
        when(roleRepository.findById("missing-role")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> roleService.deleteRole("missing-role"));
    }
}
