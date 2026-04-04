package com.zerotrust.repository;
import com.zerotrust.entity.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Optional;
@Repository
public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {
    boolean existsByTokenHash(String tokenHash);
    Optional<RevokedToken> findByTokenHash(String tokenHash);
    void deleteByRevokedAtBefore(LocalDateTime cutoff);
}