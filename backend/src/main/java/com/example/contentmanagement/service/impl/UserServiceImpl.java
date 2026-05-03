package com.example.contentmanagement.service.impl;

import com.example.contentmanagement.dto.UserDTO;
import com.example.contentmanagement.entity.User;
import com.example.contentmanagement.entity.Role;
import com.example.contentmanagement.exception.ResourceNotFoundException;
import com.example.contentmanagement.exception.DuplicateResourceException;
import com.example.contentmanagement.repository.UserRepository;
import com.example.contentmanagement.repository.RoleRepository;
import com.example.contentmanagement.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    // =========================
    // 🔥 NEW METHODS (IMPORTANT)
    // =========================
    public List<User> getAllUsersEntity() {
        return userRepository.findAll();
    }

    public User getUserEntityById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    // =========================
    // CREATE USER
    // =========================
    @Override
    @Transactional
    public UserDTO createUser(UserDTO userDTO) {

        if (existsByUsername(userDTO.getUsername())) {
            throw new DuplicateResourceException("Username already exists: " + userDTO.getUsername());
        }

        if (userDTO.getEmail() != null && existsByEmail(userDTO.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + userDTO.getEmail());
        }

        User user = User.builder()
                .username(userDTO.getUsername())
                .email(userDTO.getEmail())
                .firstName(userDTO.getFirstName())
                .lastName(userDTO.getLastName())
                .phoneNumber(userDTO.getPhoneNumber())
                .photoUrl(userDTO.getPhotoUrl())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .status("ACTIVE")
                .enabled(true)
                .locked(false)
                .createdAt(LocalDateTime.now())
                .role("USER")
                .roles(new HashSet<>())
                // 🔥 INITIALISATION FIDELITY
                .fidelityScore(0)
                .fidelityLevel("BRONZE")
                .build();

        User savedUser = userRepository.save(user);
        log.info("User created: {}", savedUser.getUsername());

        return mapToUserDTO(savedUser);
    }

    // =========================
    // GET USERS
    // =========================
    @Override
    public Optional<UserDTO> getUserById(String id) {
        return userRepository.findById(id).map(this::mapToUserDTO);
    }

    @Override
    public Optional<UserDTO> getUserByUsername(String username) {
        return userRepository.findByUsername(username).map(this::mapToUserDTO);
    }

    @Override
    public Optional<UserDTO> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(this::mapToUserDTO);
    }

    @Override
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserDTO)
                .collect(Collectors.toList());
    }

    // =========================
    // UPDATE USER
    // =========================
    @Override
    @Transactional
    public UserDTO updateUser(String id, UserDTO userDTO) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (userDTO.getUsername() != null && !userDTO.getUsername().equals(user.getUsername())) {
            if (existsByUsername(userDTO.getUsername())) {
                throw new DuplicateResourceException("Username exists");
            }
            user.setUsername(userDTO.getUsername());
        }

        if (userDTO.getEmail() != null && !userDTO.getEmail().equals(user.getEmail())) {
            if (existsByEmail(userDTO.getEmail())) {
                throw new DuplicateResourceException("Email exists");
            }
            user.setEmail(userDTO.getEmail());
        }

        user.setUpdatedAt(LocalDateTime.now());

        return mapToUserDTO(userRepository.save(user));
    }

    @Override
    public UserDTO updateProfileByEmail(String email, UserDTO userDTO) {
        return null;
    }

    @Override
    @Transactional
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    // =========================
    // CHECKS
    // =========================
    @Override
    public boolean existsByUsername(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    // =========================
    // ROLE MANAGEMENT
    // =========================
    @Transactional
    public void assignRoleToUser(String userId, String roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        user.getRoles().add(role);
        userRepository.save(user);
    }

    @Transactional
    public void removeRoleFromUser(String userId, String roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        user.getRoles().remove(role);
        userRepository.save(user);
    }

    @Transactional
    public void lockUser(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setLocked(true);
        userRepository.save(user);
    }

    @Transactional
    public void unlockUser(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setLocked(false);
        userRepository.save(user);
    }

    // =========================
    // DTO MAPPING
    // =========================
    private UserDTO mapToUserDTO(User user) {

        Set<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(roles)
                .locked(user.isLocked())
                .enabled(user.isEnabled())

                // 🔥 IMPORTANT (ajout)
                .fidelityScore(user.getFidelityScore())
                .fidelityLevel(user.getFidelityLevel())

                .build();
    }
}