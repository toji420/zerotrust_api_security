package com.zerotrust.service;
import com.zerotrust.entity.ApiLog;
import com.zerotrust.entity.ThreatEvent;
import com.zerotrust.repository.ApiLogRepository;
import com.zerotrust.repository.ThreatEventRepository;
import com.zerotrust.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BehaviorAnalyticsService {

    private final ApiLogRepository apiLogRepository;
    private final ThreatEventRepository threatEventRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PolicyEnforcementService policyEnforcementService;

    private static final int    RATE_ABUSE_LIMIT    = 100;
    private static final int    DDOS_LIMIT          = 200;
    private static final int    BRUTE_FORCE_LIMIT   = 10;
    private static final int    ENDPOINT_SCAN_LIMIT = 30;
    private static final int    PARAM_FLOOD_LIMIT   = 50;
    private static final double BLOCK_THRESHOLD     = 0.75;

    public void analyzeRequest(String username, String ip, String method,
                                String endpoint, int statusCode, long responseTime,
                                String userAgent) {
        ApiLog apiLog = ApiLog.builder()
                .username(username).ipAddress(ip).method(method)
                .endpoint(endpoint).statusCode(statusCode)
                .responseTimeMs(responseTime)
                .userAgent(userAgent != null ? userAgent : "unknown")
                .threatDetected(false).anomalyScore(0.0).build();

        BehaviorResult result = runAllChecks(username, method, endpoint, statusCode, responseTime, userAgent);

        if (result.isThreat()) {
            apiLog.setThreatDetected(true);
            apiLog.setAnomalyScore(result.getScore());
            apiLog.setThreatType(result.getThreatType());
            handleThreat(username, ip, endpoint, result);
        }
        apiLogRepository.save(apiLog);
        messagingTemplate.convertAndSend("/topic/api-activity", Map.of(
                "username",   username != null ? username : "anonymous",
                "endpoint",   endpoint != null ? endpoint : "",
                "method",     method != null ? method : "",
                "statusCode", statusCode,
                "threat",     result.isThreat(),
                "timestamp",  LocalDateTime.now().toString()
        ));
    }

    public void analyzeRequest(String username, String ip, String method,
                                String endpoint, int statusCode, long responseTime) {
        analyzeRequest(username, ip, method, endpoint, statusCode, responseTime, "unknown");
    }

    private BehaviorResult runAllChecks(String username, String method, String endpoint,
                                         int statusCode, long responseTime, String userAgent) {
        if (username == null) return BehaviorResult.noThreat();

        LocalDateTime oneMinAgo  = LocalDateTime.now().minusMinutes(1);
        LocalDateTime tenMinAgo  = LocalDateTime.now().minusMinutes(10);
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

        List<ApiLog> logsMin  = apiLogRepository.findByUsernameAndTimestampAfterOrderByTimestampDesc(username, oneMinAgo);
        List<ApiLog> logsTen  = apiLogRepository.findByUsernameAndTimestampAfterOrderByTimestampDesc(username, tenMinAgo);
        List<ApiLog> logsHour = apiLogRepository.findByUsernameAndTimestampAfterOrderByTimestampDesc(username, oneHourAgo);

        long reqPerMin = logsMin.size();

        // 1. DDoS
        if (reqPerMin > DDOS_LIMIT)
            return BehaviorResult.threat("DDOS_ATTACK", 0.98, "DDoS: " + reqPerMin + " req/min");

        // 2. Rate Abuse
        if (reqPerMin > RATE_ABUSE_LIMIT)
            return BehaviorResult.threat("RATE_ABUSE", 0.90, "Rate abuse: " + reqPerMin + " req/min");

        // 3. Brute Force
        long failedAuth = logsTen.stream()
                .filter(l -> l.getStatusCode() != null && (l.getStatusCode() == 401 || l.getStatusCode() == 403))
                .count();
        if (failedAuth >= BRUTE_FORCE_LIMIT)
            return BehaviorResult.threat("BRUTE_FORCE", 0.85, "Auth failures: " + failedAuth);

        // 4. SQL Injection
        if (endpoint != null) {
            String ep = endpoint.toLowerCase();
            if (ep.contains("--") || ep.contains("union select") || ep.contains("1=1") ||
                ep.contains("drop table") || ep.contains("insert into") || ep.contains("exec("))
                return BehaviorResult.threat("SQL_INJECTION", 0.95, "SQL injection in: " + endpoint);
        }

        // 5. XSS
        if (endpoint != null) {
            String ep = endpoint.toLowerCase();
            if (ep.contains("<script") || ep.contains("javascript:") || ep.contains("onerror=") ||
                ep.contains("alert(") || ep.contains("document.cookie"))
                return BehaviorResult.threat("XSS_ATTACK", 0.92, "XSS pattern: " + endpoint);
        }

        // 6. Path Traversal
        if (endpoint != null && (endpoint.contains("../") || endpoint.contains("..\\") ||
                endpoint.contains("/etc/passwd") || endpoint.contains("/windows/system32")))
            return BehaviorResult.threat("PATH_TRAVERSAL", 0.93, "Path traversal: " + endpoint);

        // 7. Command Injection
        if (endpoint != null) {
            String ep = endpoint.toLowerCase();
            if (ep.contains(";ls") || ep.contains("|whoami") || ep.contains("&&rm") || ep.contains(";wget"))
                return BehaviorResult.threat("COMMAND_INJECTION", 0.96, "Command injection: " + endpoint);
        }

        // 8. Endpoint Scanning
        long uniqueEp = logsTen.stream().map(ApiLog::getEndpoint)
                .filter(e -> e != null).distinct().count();
        if (uniqueEp > ENDPOINT_SCAN_LIMIT)
            return BehaviorResult.threat("ENDPOINT_SCANNING", 0.75, "Scanning: " + uniqueEp + " endpoints");

        // 9. Parameter Flooding
        if (endpoint != null) {
            long sameHits = logsMin.stream().filter(l -> endpoint.equals(l.getEndpoint())).count();
            if (sameHits > PARAM_FLOOD_LIMIT)
                return BehaviorResult.threat("PARAMETER_FLOODING", 0.80, "Flood: " + sameHits + " hits");
        }

        // 10. Credential Stuffing
        long failedHour = logsHour.stream()
                .filter(l -> l.getStatusCode() != null && l.getStatusCode() == 401).count();
        if (failedHour > 20)
            return BehaviorResult.threat("CREDENTIAL_STUFFING", 0.88, "Stuffing: " + failedHour + " failures");

        // 11. Suspicious HTTP Method
        if (method != null && (method.equals("TRACE") || method.equals("TRACK") ||
                method.equals("CONNECT") || method.equals("DEBUG")))
            return BehaviorResult.threat("SUSPICIOUS_HTTP_METHOD", 0.78, "Bad method: " + method);

        // 12. Slow Request Probe
        if (responseTime > 10000)
            return BehaviorResult.threat("SLOW_REQUEST_PROBE", 0.60, "Slow: " + responseTime + "ms");

        // 13. Account Enumeration
        long notFound = logsMin.stream()
                .filter(l -> l.getStatusCode() != null && l.getStatusCode() == 404).count();
        if (notFound > 20)
            return BehaviorResult.threat("ACCOUNT_ENUMERATION", 0.77, "404s: " + notFound);

        // 14. Attack Tool Detection
        if (userAgent != null) {
            String ua = userAgent.toLowerCase();
            if (ua.contains("sqlmap") || ua.contains("nikto") || ua.contains("nmap") ||
                ua.contains("dirbuster") || ua.contains("hydra") || ua.contains("metasploit") ||
                ua.contains("scanner") || ua.contains("masscan"))
                return BehaviorResult.threat("AUTOMATED_ATTACK_TOOL", 0.97, "Attack tool: " + userAgent);
        }

        // 15. API Fuzzing
        long serverErrors = logsTen.stream()
                .filter(l -> l.getStatusCode() != null && l.getStatusCode() >= 500).count();
        if (serverErrors > 15)
            return BehaviorResult.threat("API_FUZZING", 0.82, "Server errors: " + serverErrors);

        return BehaviorResult.noThreat();
    }

    private void handleThreat(String username, String ip, String endpoint, BehaviorResult result) {
        log.warn("THREAT | {} | {} | score={}", result.getThreatType(), username, result.getScore());
        threatEventRepository.save(ThreatEvent.builder()
                .username(username != null ? username : "anonymous")
                .ipAddress(ip)
                .threatType(result.getThreatType())
                .severity(getSeverity(result.getScore()))
                .anomalyScore(result.getScore())
                .description(result.getDescription())
                .endpoint(endpoint)
                .actionTaken(result.getScore() >= BLOCK_THRESHOLD)
                .actionDescription(result.getScore() >= BLOCK_THRESHOLD ? "User blocked" : "Logged only")
                .build());
        if (result.getScore() >= BLOCK_THRESHOLD && username != null)
            policyEnforcementService.blockUser(username, result.getThreatType() + ": " + result.getDescription());
        messagingTemplate.convertAndSend("/topic/threats", Map.of(
                "username",    username != null ? username : "anonymous",
                "threatType",  result.getThreatType(),
                "severity",    getSeverity(result.getScore()),
                "score",       result.getScore(),
                "description", result.getDescription(),
                "timestamp",   LocalDateTime.now().toString()
        ));
    }

    private String getSeverity(double score) {
        if (score >= 0.90) return "CRITICAL";
        if (score >= 0.75) return "HIGH";
        if (score >= 0.50) return "MEDIUM";
        return "LOW";
    }

    public Map<String, Object> getUserBehaviorStats(String username) {
        List<ApiLog> logs = apiLogRepository.findByUsernameAndTimestampAfterOrderByTimestampDesc(
                username, LocalDateTime.now().minusHours(24));
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRequests",   logs.size());
        stats.put("failedRequests",  logs.stream().filter(l -> l.getStatusCode() != null && l.getStatusCode() >= 400).count());
        stats.put("avgResponseTime", logs.stream().filter(l -> l.getResponseTimeMs() != null).mapToLong(ApiLog::getResponseTimeMs).average().orElse(0));
        stats.put("recentLogs",      logs.stream().limit(20).toList());
        return stats;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BehaviorResult {
        private boolean threat;
        private double  score;
        private String  threatType;
        private String  description;
        public static BehaviorResult noThreat() { return new BehaviorResult(false, 0.0, null, null); }
        public static BehaviorResult threat(String type, double score, String desc) { return new BehaviorResult(true, score, type, desc); }
    }
}