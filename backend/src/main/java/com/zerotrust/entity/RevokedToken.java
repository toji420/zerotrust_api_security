package com.zerotrust.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "revoked_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevokedToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "token_hash", unique = true, nullable = false)
    private String tokenHash;
    private String username;
    @Builder.Default private LocalDateTime revokedAt = LocalDateTime.now();
    private String reason;
}