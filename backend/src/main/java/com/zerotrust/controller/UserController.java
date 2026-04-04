package com.zerotrust.controller;
import com.zerotrust.entity.User;
import com.zerotrust.repository.*;
import com.zerotrust.service.BehaviorAnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;
@RestController @RequestMapping("/api/user") @RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final ApiLogRepository apiLogRepository;
    private final ThreatEventRepository threatEventRepository;
    private final BehaviorAnalyticsService behaviorAnalyticsService;
    @GetMapping("/profile") public ResponseEntity<?> getProfile(Authentication auth) { User u=userRepository.findByUsername(auth.getName()).orElseThrow(); u.setPassword(null); return ResponseEntity.ok(u); }
    @GetMapping("/dashboard") public ResponseEntity<?> getUserDashboard(Authentication auth) {
        Map<String,Object> stats=behaviorAnalyticsService.getUserBehaviorStats(auth.getName());
        stats.put("threatsDetected", threatEventRepository.countByUsernameAndDetectedAtAfter(auth.getName(), LocalDateTime.now().minusHours(24)));
        return ResponseEntity.ok(stats);
    }
    @GetMapping("/activity") public ResponseEntity<?> getMyActivity(Authentication auth) { return ResponseEntity.ok(apiLogRepository.findByUsernameOrderByTimestampDesc(auth.getName()).stream().limit(20).toList()); }
    @GetMapping("/test-api") public ResponseEntity<?> testApi(Authentication auth, HttpServletRequest req) {
        long start=System.currentTimeMillis();
        behaviorAnalyticsService.analyzeRequest(auth.getName(),req.getRemoteAddr(),"GET","/api/user/test-api",200,System.currentTimeMillis()-start);
        return ResponseEntity.ok(Map.of("message","API call successful","user",auth.getName(),"timestamp",LocalDateTime.now().toString()));
    }
}