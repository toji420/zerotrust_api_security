package com.zerotrust.dto;
import com.zerotrust.entity.User;
import jakarta.validation.constraints.*;
import lombok.*;
public class AuthDtos {
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
        @NotBlank private String role;
    }
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank @Size(min=3, max=30) private String username;
        @NotBlank @Email private String email;
        @NotBlank @Size(min=6) private String password;
        private User.Role role = User.Role.USER;
    }
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String username;
        private String email;
        private String role;
        private String status;
        private String message;
    }
}