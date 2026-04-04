package com.zerotrust.repository;
import com.zerotrust.entity.ThreatEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
@Repository
public interface ThreatEventRepository extends MongoRepository<ThreatEvent, String> {
    List<ThreatEvent> findByUsernameOrderByDetectedAtDesc(String username);
    List<ThreatEvent> findByDetectedAtAfterOrderByDetectedAtDesc(LocalDateTime since);
    List<ThreatEvent> findTop20ByOrderByDetectedAtDesc();
    long countByDetectedAtAfter(LocalDateTime since);
    long countByUsernameAndDetectedAtAfter(String username, LocalDateTime since);
}