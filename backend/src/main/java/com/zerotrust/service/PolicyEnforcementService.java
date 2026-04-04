package com.zerotrust.service;
import com.zerotrust.entity.RevokedToken;
import com.zerotrust.entity.User;
import com.zerotrust.repository.RevokedTokenRepository;
import com.zerotrust.repository.UserRepository;
import com.zerotrust.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Map;
@Service @RequiredArgsConstructor @Slf4j
public class PolicyEnforcementService {
    private final UserRepository userRepository;
    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtUtil jwtUtil;
    private final SimpMessagingTemplate messagingTemplate;
    @Transactional
    public void blockUser(String username, String reason) {
        userRepository.findByUsername(username).ifPresent(user -> {
            if (user.getStatus() == User.UserStatus.BLOCKED) return;
            user.setStatus(User.UserStatus.BLOCKED); user.setBlockedReason(reason); user.setBlockedAt(LocalDateTime.now());
            userRepository.save(user);
            log.warn("USER BLOCKED: {} - {}", username, reason);
            messagingTemplate.convertAndSend("/topic/user-blocked", Map.of("username", username, "reason", reason, "blockedAt", LocalDateTime.now().toString()));
        });
    }
    @Transactional
    public void unblockUser(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setStatus(User.UserStatus.ACTIVE); user.setBlockedReason(null);
            user.setBlockedAt(null); user.setFailedAttempts(0); user.setRiskScore(0.0);
            userRepository.save(user);
        });
    }
    @Transactional
    public void revokeToken(String token, String username, String reason) {
        String tokenHash = jwtUtil.hashToken(token);
        if (!revokedTokenRepository.existsByTokenHash(tokenHash))
            revokedTokenRepository.save(RevokedToken.builder().tokenHash(tokenHash).username(username).reason(reason).build());
    }
    @Scheduled(cron = "0 0 3 * * *") @Transactional
    public void cleanupExpiredTokens() { revokedTokenRepository.deleteByRevokedAtBefore(LocalDateTime.now().minusDays(7)); }
}