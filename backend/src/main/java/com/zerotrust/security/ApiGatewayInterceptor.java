package com.zerotrust.security;
import com.zerotrust.service.BehaviorAnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
@Component @RequiredArgsConstructor @Slf4j
public class ApiGatewayInterceptor implements HandlerInterceptor {
    private final BehaviorAnalyticsService behaviorAnalyticsService;
    private final ThreadLocal<Long> requestStartTime = new ThreadLocal<>();
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object h) {
        requestStartTime.set(System.currentTimeMillis()); return true;
    }
    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res, Object h, Exception ex) {
        Long start = requestStartTime.get(); if (start == null) return;
        long duration = System.currentTimeMillis() - start; requestStartTime.remove();
        if (req.getRequestURI().startsWith("/api/auth")) return;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && auth.isAuthenticated()) ? auth.getName() : null;
        String xfwd = req.getHeader("X-Forwarded-For");
        String ip = (xfwd != null) ? xfwd.split(",")[0] : req.getRemoteAddr();
        behaviorAnalyticsService.analyzeRequest(username, ip, req.getMethod(), req.getRequestURI(), res.getStatus(), duration);
    }
}