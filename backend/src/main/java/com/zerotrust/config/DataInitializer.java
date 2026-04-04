package com.zerotrust.config;
import com.zerotrust.entity.User;
import com.zerotrust.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                .username("admin").email("admin@zerotrust.com")
                .password(passwordEncoder.encode("Admin@123"))
                .role(User.Role.ADMIN).build());
            log.info("Admin created: admin / Admin@123");
        }
        if (!userRepository.existsByUsername("testuser")) {
            userRepository.save(User.builder()
                .username("testuser").email("testuser@zerotrust.com")
                .password(passwordEncoder.encode("User@123"))
                .role(User.Role.USER).build());
            log.info("Test user created: testuser / User@123");
        }
    }
}