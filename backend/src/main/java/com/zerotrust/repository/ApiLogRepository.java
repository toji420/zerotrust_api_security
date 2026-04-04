package com.zerotrust.repository;
import com.zerotrust.entity.ApiLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
@Repository
public interface ApiLogRepository extends MongoRepository<ApiLog, String> {
    List<ApiLog> findByUsernameOrderByTimestampDesc(String username);
    List<ApiLog> findByUsernameAndTimestampAfterOrderByTimestampDesc(String username, LocalDateTime since);
    List<ApiLog> findByTimestampAfterOrderByTimestampDesc(LocalDateTime since);
    List<ApiLog> findByThreatDetectedTrue();
    long countByUsernameAndTimestampAfter(String username, LocalDateTime since);
    long countByThreatDetectedTrueAndTimestampAfter(LocalDateTime since);
}