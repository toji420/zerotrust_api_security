package com.zerotrust;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
@SpringBootApplication
@EnableScheduling
public class ZeroTrustApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZeroTrustApplication.class, args);
    }
}