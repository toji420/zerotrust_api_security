package com.zerotrust.security;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
@Component @Slf4j
public class RateLimitFilter extends OncePerRequestFilter {
    private final Map<String,Bucket> buckets = new ConcurrentHashMap<>();
    private Bucket createBucket() {
        return Bucket.builder().addLimit(Bandwidth.classic(60, Refill.greedy(60, Duration.ofMinutes(1)))).build();
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String xfwd = request.getHeader("X-Forwarded-For");
        String ip = (xfwd != null) ? xfwd.split(",")[0] : request.getRemoteAddr();
        Bucket bucket = buckets.computeIfAbsent(ip, k -> createBucket());
        if (bucket.tryConsume(1)) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            chain.doFilter(request, response);
        } else {
            response.setStatus(429); response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests\",\"retryAfter\":60}");
        }
    }
}