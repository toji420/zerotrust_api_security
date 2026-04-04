package com.zerotrust.config;
import com.zerotrust.security.ApiGatewayInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
@Configuration @RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {
    private final ApiGatewayInterceptor apiGatewayInterceptor;
    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(apiGatewayInterceptor).addPathPatterns("/api/**").excludePathPatterns("/api/auth/**");
    }
}