package com.zerotrust.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false) private String username;
    @Column(unique = true, nullable = false) private String email;
    @Column(nullable = false) private String password;
    @Enumerated(EnumType.STRING) private Role role;
    @Enumerated(EnumType.STRING) @Builder.Default private UserStatus status = UserStatus.ACTIVE;
    private String blockedReason;
    private LocalDateTime blockedAt;
    private LocalDateTime lastLogin;
    @Builder.Default private Integer loginCount = 0;
    @Builder.Default private Integer failedAttempts = 0;
    @Builder.Default private Double riskScore = 0.0;
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
    public enum Role { ADMIN, USER }
    public enum UserStatus { ACTIVE, BLOCKED, SUSPENDED }
}