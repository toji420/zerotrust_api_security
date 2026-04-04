package com.zerotrust.controller;
import com.zerotrust.entity.ThreatEvent;
import com.zerotrust.entity.User;
import com.zerotrust.repository.*;
import com.zerotrust.service.PolicyEnforcementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final UserRepository userRepository;
    private final ThreatEventRepository threatEventRepository;
    private final ApiLogRepository apiLogRepository;
    private final PolicyEnforcementService policyEnforcementService;

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboardStats() {
        return ResponseEntity.ok(Map.of(
            "totalUsers",    userRepository.count(),
            "activeUsers",   userRepository.countByStatus(User.UserStatus.ACTIVE),
            "blockedUsers",  userRepository.countByStatus(User.UserStatus.BLOCKED),
            "totalThreats",  threatEventRepository.count(),
            "threatsToday",  threatEventRepository.countByDetectedAtAfter(LocalDateTime.now().minusHours(24)),
            "activeThreats", apiLogRepository.countByThreatDetectedTrueAndTimestampAfter(LocalDateTime.now().minusHours(1))
        ));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/blocked")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getBlockedUsers() {
        return ResponseEntity.ok(userRepository.findByStatus(User.UserStatus.BLOCKED));
    }

    @PostMapping("/users/{username}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> blockUser(@PathVariable String username, @RequestBody Map<String,String> body) {
        policyEnforcementService.blockUser(username, body.getOrDefault("reason", "Manually blocked"));
        return ResponseEntity.ok(Map.of("message", "User blocked"));
    }

    @PostMapping("/users/{username}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unblockUser(@PathVariable String username) {
        policyEnforcementService.unblockUser(username);
        return ResponseEntity.ok(Map.of("message", "User unblocked"));
    }

    @GetMapping("/threats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ThreatEvent>> getAllThreats() {
        return ResponseEntity.ok(threatEventRepository.findTop20ByOrderByDetectedAtDesc());
    }

    @GetMapping("/threats/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ThreatEvent>> getRecentThreats() {
        return ResponseEntity.ok(threatEventRepository.findByDetectedAtAfterOrderByDetectedAtDesc(LocalDateTime.now().minusHours(24)));
    }

    @GetMapping("/api-logs/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRecentApiLogs() {
        return ResponseEntity.ok(apiLogRepository.findByTimestampAfterOrderByTimestampDesc(LocalDateTime.now().minusHours(1)));
    }

    @GetMapping("/users/{username}/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserLogs(@PathVariable String username) {
        return ResponseEntity.ok(apiLogRepository.findByUsernameOrderByTimestampDesc(username).stream().limit(50).toList());
    }
}