package com.example.contentmanagement.controller;

import com.example.contentmanagement.dto.RoleDTO;
import com.example.contentmanagement.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Role Management Controller
 * Handles role CRUD operations
 * WHY: Provides endpoints for role management with admin-only access
 */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    /**
     * Create a new role
     * WHY: Admin operation to define new roles in the system
     *
     * @param roleDTO Role data
     * @return Created role
     */
    @PostMapping
    public ResponseEntity<RoleDTO> createRole(@Valid @RequestBody RoleDTO roleDTO) {
        RoleDTO createdRole = roleService.createRole(roleDTO);
        return new ResponseEntity<>(createdRole, HttpStatus.CREATED);
    }

    /**
     * Get role by ID
     * WHY: Retrieve role details for admin operations
     *
     * @param id Role ID
     * @return Role information
     */
    @GetMapping("/{id}")
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable String id) {
        Optional<RoleDTO> role = roleService.getRoleById(id);
        return role.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get role by name
     * WHY: Retrieve role details by name for lookup
     *
     * @param name Role name
     * @return Role information
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<RoleDTO> getRoleByName(@PathVariable String name) {
        Optional<RoleDTO> role = roleService.getRoleByName(name);
        return role.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get all roles
     * WHY: Admin functionality to view all available roles
     *
     * @return List of all roles
     */
    @GetMapping
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    /**
     * Update role
     * WHY: Admin operation to modify role definition
     *
     * @param id Role ID to update
     * @param roleDTO Updated role data
     * @return Updated role
     */
    @PutMapping("/{id}")
    public ResponseEntity<RoleDTO> updateRole(@PathVariable String id, @Valid @RequestBody RoleDTO roleDTO) {
        RoleDTO updatedRole = roleService.updateRole(id, roleDTO);
        return ResponseEntity.ok(updatedRole);
    }

    /**
     * Delete role
     * WHY: Admin operation to remove a role from the system
     *
     * @param id Role ID to delete
     * @return No content response
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRole(@PathVariable String id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }
}
