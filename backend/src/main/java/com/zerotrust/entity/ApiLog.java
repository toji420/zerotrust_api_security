package com.zerotrust.entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
@Document(collection = "api_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiLog {
    @Id private String id;
    @Indexed private String username;
    private String ipAddress;
    private String method;
    private String endpoint;
    private Integer statusCode;
    private Long responseTimeMs;
    private String userAgent;
    private Boolean threatDetected;
    private Double anomalyScore;
    private String threatType;
    @Indexed @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}