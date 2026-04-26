package com.propertystack.homematch.user;

import com.propertystack.homematch.config.SupabaseProperties;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Component
public class SupabaseAdminClient {

    private final SupabaseProperties supabaseProperties;
    private final HttpClient httpClient;

    public SupabaseAdminClient(SupabaseProperties supabaseProperties) {
        this.supabaseProperties = supabaseProperties;
        this.httpClient = HttpClient.newHttpClient();
    }

    public void deleteUser(String supabaseUserId) {
        String supabaseUrl = requireProperty(supabaseProperties.url(), "app.supabase.url");
        String serviceRoleKey = requireProperty(
                supabaseProperties.serviceRoleKey(),
                "app.supabase.service-role-key"
        );

        String encodedUserId = URLEncoder.encode(supabaseUserId, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(supabaseUrl + "/auth/v1/admin/users/" + encodedUserId))
                .header("apikey", serviceRoleKey)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .DELETE()
                .build();

        try {
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());

            if (response.statusCode() == 404 || response.statusCode() == 204) {
                return;
            }

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Failed to delete Supabase Auth user");
            }
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalStateException("Failed to delete Supabase Auth user", ex);
        }
    }

    private String requireProperty(String value, String propertyName) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required configuration: " + propertyName);
        }

        return value;
    }
}
