package com.propertystack.homematch.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(
        List<String> allowedOrigins,
        Jwt jwt,
        RateLimit rateLimit
) {

    public SecurityProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
        jwt = jwt == null ? new Jwt(null) : jwt;
        rateLimit = rateLimit == null ? new RateLimit(Duration.ofMinutes(1), 120, 30, 60) : rateLimit;
    }

    public record Jwt(String audience) {
    }

    public record RateLimit(
            Duration window,
            int publicRequestsPerWindow,
            int suggestionRequestsPerWindow,
            int authenticatedWriteRequestsPerWindow
    ) {
        public RateLimit {
            window = window == null ? Duration.ofMinutes(1) : window;
            publicRequestsPerWindow = Math.max(publicRequestsPerWindow, 1);
            suggestionRequestsPerWindow = Math.max(suggestionRequestsPerWindow, 1);
            authenticatedWriteRequestsPerWindow = Math.max(authenticatedWriteRequestsPerWindow, 1);
        }
    }
}
