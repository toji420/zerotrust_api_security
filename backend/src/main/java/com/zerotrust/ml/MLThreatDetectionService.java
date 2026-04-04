package com.zerotrust.ml;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;
@Service @RequiredArgsConstructor @Slf4j
public class MLThreatDetectionService {
    @Value("${ml.service.url}") private String mlServiceUrl;
    private final WebClient.Builder webClientBuilder;
    public Mono<ThreatPrediction> predict(Map<String,Object> features) {
        return webClientBuilder.build().post().uri(mlServiceUrl+"/predict").bodyValue(features).retrieve()
            .bodyToMono(ThreatPrediction.class)
            .onErrorReturn(new ThreatPrediction(false,0.0,"NORMAL","ML service unavailable"))
            .timeout(java.time.Duration.ofSeconds(2));
    }
    public record ThreatPrediction(boolean isAnomaly, double anomalyScore, String threatType, String details) {}
}