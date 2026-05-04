package com.example.contentmanagement.service;

import com.example.contentmanagement.dto.RoleDTO;
import java.util.List;
import java.util.Optional;

/**
 * Role Service Interface
 * Defines contract for role management operations
 */
public interface RoleService {
    /**
     * Create a new role
     * @param roleDTO Role data
     * @return Created role DTO
     */
    RoleDTO createRole(RoleDTO roleDTO);

    /**
     * Get role by ID
     * @param id Role ID
     * @return Role DTO if found
     */
    Optional<RoleDTO> getRoleById(String id);

    /**
     * Get role by name
     * @param name Role name
     * @return Role DTO if found
     */
    Optional<RoleDTO> getRoleByName(String name);

    /**
     * Get all roles
     * @return List of all roles
     */
    List<RoleDTO> getAllRoles();

    /**
     * Update role
     * @param id Role ID
     * @param roleDTO Updated role data
     * @return Updated role DTO
     */
    RoleDTO updateRole(String id, RoleDTO roleDTO);

    /**
     * Delete role
     * @param id Role ID to delete
     */
    void deleteRole(String id);

    /**
     * Check if role exists by name
     * @param name Role name
     * @return true if exists, false otherwise
     */
    boolean existsByName(String name);
}
