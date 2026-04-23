package com.propertystack.homematch.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final SecurityProperties securityProperties;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, FixedWindowCounter> counters = new ConcurrentHashMap<>();

    public RateLimitingFilter(SecurityProperties securityProperties, ObjectMapper objectMapper) {
        this.securityProperties = securityProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/")
                || HttpMethod.OPTIONS.matches(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String bucket = bucket(request);
        int limit = limitFor(request);

        if (consume(bucket, limit)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                "error", HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                "message", "Too many requests. Please try again shortly.",
                "path", request.getRequestURI()
        )));
    }

    private boolean consume(String bucket, int limit) {
        Instant now = Instant.now();
        Instant windowStart = now.minus(securityProperties.rateLimit().window());

        FixedWindowCounter counter = counters.compute(bucket, (key, current) -> {
            if (current == null || current.windowStartedAt().isBefore(windowStart)) {
                return new FixedWindowCounter(now, new AtomicInteger(1));
            }

            current.requestCount().incrementAndGet();
            return current;
        });

        return counter.requestCount().get() <= limit;
    }

    private int limitFor(HttpServletRequest request) {
        String path = request.getRequestURI();

        if (path.startsWith("/api/listings/suggestions")) {
            return securityProperties.rateLimit().suggestionRequestsPerWindow();
        }

        if (isAuthenticatedWrite(request)) {
            return securityProperties.rateLimit().authenticatedWriteRequestsPerWindow();
        }

        return securityProperties.rateLimit().publicRequestsPerWindow();
    }

    private String bucket(HttpServletRequest request) {
        return classify(request) + ":" + clientIp(request);
    }

    private String classify(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/listings/suggestions")) {
            return "suggestions";
        }
        if (isAuthenticatedWrite(request)) {
            return "authenticated-write";
        }
        return "default";
    }

    private boolean isAuthenticatedWrite(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean authenticated = authentication != null && authentication.isAuthenticated();
        return authenticated && !HttpMethod.GET.matches(request.getMethod());
    }

    private String clientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr == null || remoteAddr.isBlank() ? "unknown" : remoteAddr;
    }

    private record FixedWindowCounter(Instant windowStartedAt, AtomicInteger requestCount) {
    }
}
