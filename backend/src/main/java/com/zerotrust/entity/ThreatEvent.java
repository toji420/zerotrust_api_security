package com.zerotrust.entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
@Document(collection = "threat_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThreatEvent {
    @Id private String id;
    @Indexed private String username;
    private String ipAddress;
    private String threatType;
    private String severity;
    private Double anomalyScore;
    private String description;
    private String endpoint;
    private Boolean actionTaken;
    private String actionDescription;
    @Indexed @Builder.Default private LocalDateTime detectedAt = LocalDateTime.now();
}