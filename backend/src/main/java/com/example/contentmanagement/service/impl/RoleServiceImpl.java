package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.RoleDTO;
import com.example.contentmanagement.entity.Role;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.exception.DuplicateResourceException;
import com.example.contentmanagement.repository.RoleRepository;
import com.example.contentmanagement.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Role Service Implementation
 * Handles all role management business logic
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public RoleDTO createRole(RoleDTO roleDTO) {
        if (existsByName(roleDTO.getName())) {
            throw new DuplicateResourceException("Role already exists: " + roleDTO.getName());
        }

        Role role = Role.builder()
                .name(roleDTO.getName())
                .description(roleDTO.getDescription())
                .permissions(roleDTO.getPermissions())
                .createdAt(LocalDateTime.now())
                .build();

        Role savedRole = roleRepository.save(role);
        log.info("Role created successfully: {}", savedRole.getName());
        return mapToRoleDTO(savedRole);
    }

    @Override
    public Optional<RoleDTO> getRoleById(String id) {
        return roleRepository.findById(id).map(this::mapToRoleDTO);
    }

    @Override
    public Optional<RoleDTO> getRoleByName(String name) {
        return roleRepository.findByName(name).map(this::mapToRoleDTO);
    }

    @Override
    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToRoleDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoleDTO updateRole(String id, RoleDTO roleDTO) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));

        if (roleDTO.getName() != null && !roleDTO.getName().equals(role.getName())) {
            if (existsByName(roleDTO.getName())) {
                throw new DuplicateResourceException("Role already exists: " + roleDTO.getName());
            }
            role.setName(roleDTO.getName());
        }

        if (roleDTO.getDescription() != null) {
            role.setDescription(roleDTO.getDescription());
        }

        if (roleDTO.getPermissions() != null) {
            role.setPermissions(roleDTO.getPermissions());
        }

        role.setUpdatedAt(LocalDateTime.now());
        Role updatedRole = roleRepository.save(role);
        log.info("Role updated successfully: {}", updatedRole.getName());
        return mapToRoleDTO(updatedRole);
    }

    @Override
    @Transactional
    public void deleteRole(String id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
        roleRepository.delete(role);
        log.info("Role deleted successfully: {}", role.getName());
    }

    @Override
    public boolean existsByName(String name) {
        return roleRepository.findByName(name).isPresent();
    }

    private RoleDTO mapToRoleDTO(Role role) {
        return RoleDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .permissions(role.getPermissions())
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }
}
