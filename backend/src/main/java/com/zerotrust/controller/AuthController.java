package com.zerotrust.controller;
import com.zerotrust.dto.AuthDtos;
import com.zerotrust.entity.User;
import com.zerotrust.repository.UserRepository;
import com.zerotrust.security.JwtUtil;
import com.zerotrust.service.PolicyEnforcementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor @Slf4j
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PolicyEnforcementService policyEnforcementService;
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) return ResponseEntity.badRequest().body(Map.of("error","Username already exists"));
        if (userRepository.existsByEmail(request.getEmail())) return ResponseEntity.badRequest().body(Map.of("error","Email already registered"));
        userRepository.save(User.builder().username(request.getUsername()).email(request.getEmail()).password(passwordEncoder.encode(request.getPassword())).role(request.getRole() != null ? request.getRole() : User.Role.USER).build());
        return ResponseEntity.ok(Map.of("message","User registered successfully"));
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            if (user != null) { user.setFailedAttempts(user.getFailedAttempts()+1); if(user.getFailedAttempts()>=5) policyEnforcementService.blockUser(user.getUsername(),"Too many failed login attempts"); userRepository.save(user); }
            return ResponseEntity.status(401).body(Map.of("error","Invalid credentials"));
        }
        if (user.getStatus() == User.UserStatus.BLOCKED) return ResponseEntity.status(403).body(Map.of("error","Account blocked: "+user.getBlockedReason(),"blocked",true));
        if (!user.getRole().name().equals(request.getRole().toUpperCase())) return ResponseEntity.status(403).body(Map.of("error","Access denied: You do not have "+request.getRole()+" privileges"));
        user.setFailedAttempts(0); user.setLastLogin(LocalDateTime.now()); user.setLoginCount(user.getLoginCount()+1); userRepository.save(user);
        return ResponseEntity.ok(AuthDtos.AuthResponse.builder().token(jwtUtil.generateToken(user.getUsername(),user.getRole().name())).username(user.getUsername()).email(user.getEmail()).role(user.getRole().name()).status(user.getStatus().name()).message("Login successful").build());
    }
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) { String token = authHeader.substring(7); policyEnforcementService.revokeToken(token, jwtUtil.extractUsername(token), "User logout"); }
        return ResponseEntity.ok(Map.of("message","Logged out successfully"));
    }
}