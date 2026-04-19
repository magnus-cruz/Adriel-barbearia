package com.barbearia.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Em desenvolvimento local, aceitamos as origens mais comuns.
                .allowedOrigins(
                        "http://localhost:5500",
                        "http://127.0.0.1:5500",
                        "http://localhost:3000",
                        "file://",
                        "*"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                // Com wildcard em origens, credentials deve ficar false.
                .allowCredentials(false)
                .maxAge(3600);
    }
}
