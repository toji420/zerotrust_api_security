package com.zerotrust.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.*;
import java.util.function.Function;
@Component @Slf4j
public class JwtUtil {
    @Value("${jwt.secret}") private String secret;
    @Value("${jwt.expiration}") private Long expiration;
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(Base64.getEncoder().encodeToString(secret.getBytes()));
        return Keys.hmacShaKeyFor(keyBytes);
    }
    public String generateToken(String username, String role) {
        Map<String,Object> claims = new HashMap<>();
        claims.put("role", role);
        return Jwts.builder().setClaims(claims).setSubject(username)
            .setIssuedAt(new Date(System.currentTimeMillis()))
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }
    public String extractUsername(String token) { return extractClaim(token, Claims::getSubject); }
    public String extractRole(String token) { return extractClaim(token, c -> c.get("role", String.class)); }
    public Date extractExpiration(String token) { return extractClaim(token, Claims::getExpiration); }
    public <T> T extractClaim(String token, Function<Claims,T> r) { return r.apply(extractAllClaims(token)); }
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
    }
    public boolean isTokenValid(String token, String username) {
        try { return extractUsername(token).equals(username) && !isTokenExpired(token); } catch(Exception e){ return false; }
    }
    public boolean isTokenExpired(String token) { return extractExpiration(token).before(new Date()); }
    public String hashToken(String token) {
        try {
            java.security.MessageDigest d = java.security.MessageDigest.getInstance("SHA-256");
            byte[] h = d.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for(byte b : h){ String hex=Integer.toHexString(0xff&b); if(hex.length()==1)sb.append("0"); sb.append(hex); }
            return sb.toString();
        } catch(Exception e){ return String.valueOf(token.hashCode()); }
    }
}